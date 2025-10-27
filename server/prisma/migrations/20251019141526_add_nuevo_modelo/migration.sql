/*
  Warnings:

  - You are about to drop the `Activos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ActivosHistorial` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ActivosImage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Activos" DROP CONSTRAINT "Activos_equipoId_fkey";

-- DropForeignKey
ALTER TABLE "Activos" DROP CONSTRAINT "Activos_userId_fkey";

-- DropForeignKey
ALTER TABLE "ActivosHistorial" DROP CONSTRAINT "ActivosHistorial_ActivosId_fkey";

-- DropForeignKey
ALTER TABLE "ActivosHistorial" DROP CONSTRAINT "ActivosHistorial_userId_fkey";

-- DropForeignKey
ALTER TABLE "_ActivosImage" DROP CONSTRAINT "_ActivosImage_A_fkey";

-- DropForeignKey
ALTER TABLE "_ActivosImage" DROP CONSTRAINT "_ActivosImage_B_fkey";

-- DropTable
DROP TABLE "Activos";

-- DropTable
DROP TABLE "ActivosHistorial";

-- DropTable
DROP TABLE "_ActivosImage";

-- CreateTable
CREATE TABLE "Activo" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "valor" TEXT,
    "userId" INTEGER,
    "equipoId" INTEGER NOT NULL,

    CONSTRAINT "Activo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivoHistorial" (
    "id" SERIAL NOT NULL,
    "activoId" INTEGER NOT NULL,
    "valorAnterior" TEXT,
    "valorNuevo" TEXT,
    "userId" INTEGER NOT NULL,
    "fechaCambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivoHistorial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ActivoImage" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ActivoImage_AB_unique" ON "_ActivoImage"("A", "B");

-- CreateIndex
CREATE INDEX "_ActivoImage_B_index" ON "_ActivoImage"("B");

-- AddForeignKey
ALTER TABLE "Activo" ADD CONSTRAINT "Activo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activo" ADD CONSTRAINT "Activo_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "Equipo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivoHistorial" ADD CONSTRAINT "ActivoHistorial_activoId_fkey" FOREIGN KEY ("activoId") REFERENCES "Activo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivoHistorial" ADD CONSTRAINT "ActivoHistorial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActivoImage" ADD CONSTRAINT "_ActivoImage_A_fkey" FOREIGN KEY ("A") REFERENCES "Activo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActivoImage" ADD CONSTRAINT "_ActivoImage_B_fkey" FOREIGN KEY ("B") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;
