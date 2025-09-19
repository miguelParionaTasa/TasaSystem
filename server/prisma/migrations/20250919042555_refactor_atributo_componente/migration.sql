/*
  Warnings:

  - You are about to drop the column `ubicacionId` on the `Atributo` table. All the data in the column will be lost.
  - Added the required column `componenteId` to the `Atributo` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Atributo" DROP CONSTRAINT "Atributo_ubicacionId_fkey";

-- AlterTable
ALTER TABLE "Atributo" DROP COLUMN "ubicacionId",
ADD COLUMN     "componenteId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Atributo" ADD CONSTRAINT "Atributo_componenteId_fkey" FOREIGN KEY ("componenteId") REFERENCES "Componente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
