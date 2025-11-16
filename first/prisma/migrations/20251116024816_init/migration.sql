-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "cardName" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "player" TEXT NOT NULL,
    "grade" INTEGER,
    "condition" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "base64image" TEXT NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Card_player_idx" ON "Card"("player");

-- CreateIndex
CREATE INDEX "Card_year_idx" ON "Card"("year");
