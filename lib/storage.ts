import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { del, put } from "@vercel/blob";

/**
 * Media storage with two backends behind one call signature:
 * - Vercel Blob when BLOB_READ_WRITE_TOKEN is set (production — the
 *   serverless filesystem is ephemeral, so local writes don't persist);
 * - public/uploads on the local filesystem otherwise (development).
 */
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_DIMENSION = 2560;

function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export type StoredImage = {
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
};

async function persist(
  filename: string,
  data: Buffer,
  contentType: string,
): Promise<string> {
  if (blobConfigured()) {
    const blob = await put(`uploads/${filename}`, data, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });
    return blob.url;
  }
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), data);
  return `/uploads/${filename}`;
}

/**
 * SVG is the one upload type that is stored verbatim rather than being
 * re-encoded by sharp, so it is also the one that can carry script. An
 * uploaded SVG is served from our own origin, which makes an unsanitised
 * one a stored-XSS primitive for any account that can reach the media
 * library.
 *
 * This strips the known execution vectors; the response CSP on /uploads
 * (next.config.ts) is the second layer that blocks execution even if a
 * novel vector slips past the regexes here.
 */
function sanitizeSvg(buffer: Buffer): Buffer {
  let svg = buffer.toString("utf8");

  // Anything that executes, embeds, or pulls in remote documents.
  svg = svg.replace(
    /<\s*(script|foreignObject|iframe|embed|object|link|meta|base)\b[\s\S]*?<\s*\/\s*\1\s*>/gi,
    "",
  );
  svg = svg.replace(
    /<\s*(script|foreignObject|iframe|embed|object|link|meta|base|set|animate)\b[^>]*\/?\s*>/gi,
    "",
  );
  // Inline event handlers: onload=, onclick=, onbegin=…
  svg = svg.replace(/\son[a-z-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  // javascript:/vbscript: and data: URLs in href/xlink:href/src/style.
  svg = svg.replace(/(?:java|vb)script\s*:/gi, "");
  svg = svg.replace(/data\s*:\s*text\/html/gi, "");
  // External entity declarations (XXE) and processing of remote DTDs.
  svg = svg.replace(/<!DOCTYPE[\s\S]*?>/gi, "");
  svg = svg.replace(/<!ENTITY[\s\S]*?>/gi, "");

  return Buffer.from(svg, "utf8");
}

/** The declared MIME comes from the client and is trivially spoofed, so an
    SVG must actually look like one before it is written. */
function looksLikeSvg(buffer: Buffer): boolean {
  const head = buffer.subarray(0, 1024).toString("utf8").trimStart().toLowerCase();
  return head.startsWith("<svg") || head.startsWith("<?xml");
}

export async function saveImage(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
): Promise<StoredImage> {
  const id = randomBytes(10).toString("hex");

  if (mimeType === "image/svg+xml") {
    if (!looksLikeSvg(buffer)) {
      throw new Error("File is not an SVG despite its declared type.");
    }
    const filename = `${id}.svg`;
    const clean = sanitizeSvg(buffer);
    const url = await persist(filename, clean, mimeType);
    return {
      filename,
      url,
      mimeType,
      size: clean.length,
      width: null,
      height: null,
    };
  }

  // Everything raster becomes WebP, capped at MAX_DIMENSION.
  const processed = await sharp(buffer)
    .rotate() // respect EXIF orientation
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  const filename = `${id}.webp`;
  const url = await persist(filename, processed.data, "image/webp");
  return {
    filename,
    url,
    mimeType: "image/webp",
    size: processed.data.length,
    width: processed.info.width,
    height: processed.info.height,
  };
}

export async function deleteStoredFile(
  filename: string,
  url: string,
): Promise<void> {
  if (blobConfigured() && url.startsWith("http")) {
    await del(url).catch(() => {});
    return;
  }
  // Defense in depth: never allow traversal out of the upload dir.
  const safe = path.basename(filename);
  await unlink(path.join(UPLOAD_DIR, safe)).catch(() => {});
}
