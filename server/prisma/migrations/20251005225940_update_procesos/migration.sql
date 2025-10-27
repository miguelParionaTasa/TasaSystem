/*
  Warnings:

  - You are about to drop the column `equipoId` on the `Procesos` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Procesos" DROP CONSTRAINT "Procesos_equipoId_fkey";

-- AlterTable
ALTER TABLE "Procesos" DROP COLUMN "equipoId",
ADD COLUMN     "ubicacionId" INTEGER;

-- AddForeignKey
ALTER TABLE "Procesos" ADD CONSTRAINT "Procesos_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
