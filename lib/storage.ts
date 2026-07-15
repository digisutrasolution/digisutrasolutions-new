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

export async function saveImage(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
): Promise<StoredImage> {
  const id = randomBytes(10).toString("hex");

  if (mimeType === "image/svg+xml") {
    const filename = `${id}.svg`;
    const url = await persist(filename, buffer, mimeType);
    return {
      filename,
      url,
      mimeType,
      size: buffer.length,
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
