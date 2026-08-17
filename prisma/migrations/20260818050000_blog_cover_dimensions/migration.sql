-- Intrinsic cover size, so the article hero can render at the image's own
-- ratio instead of cropping. Additive and nullable: no existing row is
-- rewritten, and a post without dimensions keeps the old fixed-height box.
-- Existing posts are filled by scripts/backfill-cover-dimensions.mjs.
ALTER TABLE "BlogPost" ADD COLUMN "coverWidth" INTEGER;
ALTER TABLE "BlogPost" ADD COLUMN "coverHeight" INTEGER;
