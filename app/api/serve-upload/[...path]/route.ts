import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { join, normalize, sep } from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serves files from public/uploads by reading the filesystem on every request.
 * Next's built-in public/ static handler only serves files that existed when
 * the server started, so anything uploaded at runtime 404s until the next
 * rebuild — which silently broke video (and any new) uploads. This route is
 * wired via a beforeFiles rewrite (/uploads/:path* → here) so all media goes
 * through it, and it honours HTTP Range requests so video streams and seeks.
 */

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

const TYPES: Record<string, string> = {
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  avif: "image/avif",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  pdf: "application/pdf",
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  // Resolve safely under UPLOAD_DIR — never allow path traversal out of it.
  const rel = normalize(path.join("/")).replace(/^(\.\.(\/|\\|$))+/, "");
  const file = join(UPLOAD_DIR, rel);
  if (file !== UPLOAD_DIR && !file.startsWith(UPLOAD_DIR + sep)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let info;
  try {
    info = await stat(file);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
  if (!info.isFile()) return new NextResponse("Not found", { status: 404 });

  const ext = (rel.split(".").pop() ?? "").toLowerCase();
  const type = TYPES[ext] ?? "application/octet-stream";
  const size = info.size;
  const common: Record<string, string> = {
    "Content-Type": type,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
  };

  const range = req.headers.get("range");
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    let start = m?.[1] ? parseInt(m[1], 10) : 0;
    let end = m?.[2] ? parseInt(m[2], 10) : size - 1;
    if (Number.isNaN(start)) start = 0;
    if (Number.isNaN(end) || end >= size) end = size - 1;
    if (start > end || start >= size) {
      return new NextResponse("Range Not Satisfiable", {
        status: 416,
        headers: { "Content-Range": `bytes */${size}` },
      });
    }
    const body = Readable.toWeb(createReadStream(file, { start, end })) as unknown as ReadableStream;
    return new NextResponse(body, {
      status: 206,
      headers: {
        ...common,
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Content-Length": String(end - start + 1),
      },
    });
  }

  const body = Readable.toWeb(createReadStream(file)) as unknown as ReadableStream;
  return new NextResponse(body, {
    status: 200,
    headers: { ...common, "Content-Length": String(size) },
  });
}
