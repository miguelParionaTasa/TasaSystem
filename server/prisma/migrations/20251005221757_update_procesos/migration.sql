-- DropForeignKey
ALTER TABLE "Procesos" DROP CONSTRAINT "Procesos_equipoId_fkey";

-- AlterTable
ALTER TABLE "Procesos" ALTER COLUMN "equipoId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Procesos" ADD CONSTRAINT "Procesos_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "Equipo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
