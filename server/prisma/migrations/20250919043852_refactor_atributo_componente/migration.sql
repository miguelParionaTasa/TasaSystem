/*
  Warnings:

  - You are about to drop the column `componenteId` on the `Atributo` table. All the data in the column will be lost.
  - Added the required column `equipoId` to the `Atributo` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Atributo" DROP CONSTRAINT "Atributo_componenteId_fkey";

-- AlterTable
ALTER TABLE "Atributo" DROP COLUMN "componenteId",
ADD COLUMN     "equipoId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Atributo" ADD CONSTRAINT "Atributo_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "Equipo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
