-- AlterTable: Add morningAlerts and alertHour to User
ALTER TABLE "User" ADD COLUMN "morningAlerts" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "alertHour" INTEGER NOT NULL DEFAULT 7;

-- AlterTable: Add imageUrl to PrendaArmario
ALTER TABLE "PrendaArmario" ADD COLUMN "imageUrl" TEXT;

-- AlterTable: Add isPublic to Consulta
ALTER TABLE "Consulta" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex for public outfits feed
CREATE INDEX "Consulta_isPublic_createdAt_idx" ON "Consulta"("isPublic", "createdAt");

-- CreateTable: OutfitLike
CREATE TABLE "OutfitLike" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "consultaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OutfitLike_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX "OutfitLike_userId_consultaId_key" ON "OutfitLike"("userId", "consultaId");
CREATE INDEX "OutfitLike_consultaId_idx" ON "OutfitLike"("consultaId");
CREATE INDEX "OutfitLike_userId_idx" ON "OutfitLike"("userId");

-- AddForeignKey
ALTER TABLE "OutfitLike" ADD CONSTRAINT "OutfitLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OutfitLike" ADD CONSTRAINT "OutfitLike_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "Consulta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
