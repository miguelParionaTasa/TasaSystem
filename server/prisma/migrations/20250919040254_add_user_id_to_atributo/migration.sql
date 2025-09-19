/*
  Warnings:

  - You are about to drop the column `componenteId` on the `Atributo` table. All the data in the column will be lost.
  - Added the required column `ubicacionId` to the `Atributo` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Atributo" DROP CONSTRAINT "Atributo_componenteId_fkey";

-- AlterTable
ALTER TABLE "Atributo" DROP COLUMN "componenteId",
ADD COLUMN     "ubicacionId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Atributo" ADD CONSTRAINT "Atributo_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
