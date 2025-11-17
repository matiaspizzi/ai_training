/*
  Warnings:

  - You are about to drop the column `base64image` on the `Card` table. All the data in the column will be lost.
  - Added the required column `imageUrl` to the `Card` table without a default value. This is not possible if the table is not empty.
  - Made the column `grade` on table `Card` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Card" DROP COLUMN "base64image",
ADD COLUMN     "imageUrl" TEXT NOT NULL,
ALTER COLUMN "grade" SET NOT NULL;
