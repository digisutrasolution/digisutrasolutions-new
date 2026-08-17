/**
 * Fill in BlogPost.coverWidth / coverHeight for posts that predate the field.
 *
 * The article hero renders a cover at its own ratio only when it knows the
 * ratio; without these values a post keeps the old fixed-height box and stays
 * cropped. New covers are measured in the editor — this is for everything
 * already published.
 *
 * Three sources, in order of cost:
 *   1. a MediaAsset row for that URL, which already stores width/height;
 *   2. a site-relative path → read public/<path> from disk;
 *   3. an http(s) URL → fetch the bytes (this is what handles Blob storage).
 *
 * Safe to re-run: it only touches rows where a dimension is missing.
 */
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import path from "node:path";
import { readFile } from "node:fs/promises";

const db = new PrismaClient();

async function measure(url) {
  const asset = await db.mediaAsset
    .findFirst({ where: { url }, select: { width: true, height: true } })
    .catch(() => null);
  if (asset?.width && asset?.height) {
    return { width: asset.width, height: asset.height, via: "MediaAsset" };
  }

  try {
    let buf;
    if (/^https?:\/\//i.test(url)) {
      const res = await fetch(url);
      if (!res.ok) return null;
      buf = Buffer.from(await res.arrayBuffer());
    } else {
      // Site-relative: strip the leading slash and read from public/.
      buf = await readFile(path.join(process.cwd(), "public", url.replace(/^\/+/, "")));
    }
    const m = await sharp(buf).metadata();
    if (!m.width || !m.height) return null;
    return { width: m.width, height: m.height, via: /^https?:/i.test(url) ? "fetch" : "public/" };
  } catch {
    return null;
  }
}

const posts = await db.blogPost.findMany({
  where: {
    coverUrl: { not: null },
    OR: [{ coverWidth: null }, { coverHeight: null }],
  },
  select: { id: true, slug: true, coverUrl: true },
});

console.log(`${posts.length} post(s) with a cover and no dimensions.\n`);

let filled = 0;
const skipped = [];

for (const p of posts) {
  const dims = await measure(p.coverUrl);
  if (!dims) {
    skipped.push(p);
    console.log(`  SKIP  ${p.slug}  (${p.coverUrl}) — could not measure`);
    continue;
  }
  await db.blogPost.update({
    where: { id: p.id },
    data: { coverWidth: dims.width, coverHeight: dims.height },
  });
  filled += 1;
  console.log(
    `  OK    ${p.slug}  ${dims.width}x${dims.height}  ratio ${(dims.width / dims.height).toFixed(2)}  via ${dims.via}`,
  );
}

console.log(`\nFilled ${filled}, skipped ${skipped.length}.`);
if (skipped.length) {
  /* Named explicitly: a silent partial backfill leaves some posts cropped with
     no clue why. These keep the old fixed box until their cover is re-saved
     from the editor, which measures it in the browser. */
  console.log("Still cropped until their cover is re-saved in the editor:");
  for (const p of skipped) console.log(`  - ${p.slug}  ${p.coverUrl}`);
}

await db.$disconnect();
