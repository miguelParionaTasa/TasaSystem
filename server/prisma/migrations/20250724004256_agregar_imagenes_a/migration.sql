/*
  Warnings:

  - You are about to drop the column `responsable` on the `InventarioItem` table. All the data in the column will be lost.
  - Added the required column `responsableId` to the `InventarioItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "InventarioItem" DROP COLUMN "responsable",
ADD COLUMN     "responsableId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "InventarioItem" ADD CONSTRAINT "InventarioItem_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
