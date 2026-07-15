-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT 'HEADER',
    "parentId" TEXT,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL DEFAULT '#',
    "icon" TEXT,
    "group" TEXT,
    "badge" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "newTab" BOOLEAN NOT NULL DEFAULT false,
    "panelImage" TEXT,
    "tagline" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuVersion" (
    "id" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "authorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenuVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MenuItem_location_parentId_order_idx" ON "MenuItem"("location", "parentId", "order");

-- CreateIndex
CREATE INDEX "MenuVersion_location_createdAt_idx" ON "MenuVersion"("location", "createdAt");

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
