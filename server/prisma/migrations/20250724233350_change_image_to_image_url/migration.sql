/*
  Warnings:

  - You are about to drop the column `imageId` on the `InventarioItem` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "InventarioItem" DROP CONSTRAINT "InventarioItem_imageId_fkey";

-- AlterTable
ALTER TABLE "InventarioItem" DROP COLUMN "imageId",
ADD COLUMN     "imageUrl" TEXT;
