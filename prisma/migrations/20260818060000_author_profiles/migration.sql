-- Public author profiles, for E-E-A-T bylines.

CREATE TABLE "Author" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT '',
    "photoUrl" TEXT,
    "bio" TEXT NOT NULL DEFAULT '',
    "experienceYears" INTEGER,
    "credentials" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "linkedinUrl" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Author_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Author_slug_key" ON "Author"("slug");
CREATE UNIQUE INDEX "Author_userId_key" ON "Author"("userId");
CREATE INDEX "Author_isActive_name_idx" ON "Author"("isActive", "name");

ALTER TABLE "Author" ADD CONSTRAINT "Author_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- BlogPost.authorId held USER ids under an unenforced convention — there was
-- no foreign key, so nothing ever checked what it pointed at. It has to be
-- cleared before it can reference Author, or the constraint below would fail
-- on every existing row.
--
-- Nothing is lost: authorName still holds the label these posts were published
-- under, and scripts/backfill-authors.mjs re-links the ones that map to a real
-- person. Posts that were genuinely team-written stay null and render under
-- the organisation byline, which is the honest answer.
UPDATE "BlogPost" SET "authorId" = NULL;

CREATE INDEX "BlogPost_authorId_idx" ON "BlogPost"("authorId");
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE SET NULL ON UPDATE CASCADE;
