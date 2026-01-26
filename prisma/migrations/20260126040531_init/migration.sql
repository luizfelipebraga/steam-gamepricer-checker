-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "steamAppId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "headerImage" TEXT,
    "developers" TEXT,
    "publishers" TEXT,
    "releaseDate" TEXT,
    "genres" TEXT,
    "shortDescription" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "initialPrice" INTEGER,
    "finalPrice" INTEGER NOT NULL,
    "discountPercent" INTEGER,
    "isOnSale" BOOLEAN NOT NULL DEFAULT false,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PriceHistory_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_steamAppId_key" ON "Game"("steamAppId");

-- CreateIndex
CREATE INDEX "Game_steamAppId_idx" ON "Game"("steamAppId");

-- CreateIndex
CREATE INDEX "Game_name_idx" ON "Game"("name");

-- CreateIndex
CREATE INDEX "PriceHistory_gameId_recordedAt_idx" ON "PriceHistory"("gameId", "recordedAt");

-- CreateIndex
CREATE INDEX "PriceHistory_recordedAt_idx" ON "PriceHistory"("recordedAt");

-- CreateIndex
CREATE INDEX "PriceHistory_isOnSale_idx" ON "PriceHistory"("isOnSale");
