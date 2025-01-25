/*
  Warnings:

  - You are about to drop the column `authorId` on the `Movements` table. All the data in the column will be lost.
  - You are about to drop the column `published` on the `Movements` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Movements` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tgId]` on the table `Movements` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tgId` to the `Movements` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Movements" DROP CONSTRAINT "Movements_authorId_fkey";

-- AlterTable
ALTER TABLE "Movements" DROP COLUMN "authorId",
DROP COLUMN "published",
DROP COLUMN "title",
ADD COLUMN     "connected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "name" VARCHAR(255),
ADD COLUMN     "tgId" BIGINT NOT NULL,
ADD COLUMN     "userId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Movements_tgId_key" ON "Movements"("tgId");

-- AddForeignKey
ALTER TABLE "Movements" ADD CONSTRAINT "Movements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
