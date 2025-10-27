-- DropForeignKey
ALTER TABLE "Activo" DROP CONSTRAINT "Activo_equipoId_fkey";

-- AlterTable
ALTER TABLE "Activo" ADD COLUMN     "marca" TEXT,
ADD COLUMN     "modelo" TEXT,
ADD COLUMN     "serie" TEXT,
ADD COLUMN     "ubicacion" TEXT,
ADD COLUMN     "valor2" TEXT,
ADD COLUMN     "zona" TEXT,
ALTER COLUMN "equipoId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Activo" ADD CONSTRAINT "Activo_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "Equipo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
