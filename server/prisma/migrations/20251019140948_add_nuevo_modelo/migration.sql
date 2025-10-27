-- CreateTable
CREATE TABLE "Clinica" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "valor" TEXT,
    "userId" INTEGER,
    "equipoId" INTEGER NOT NULL,

    CONSTRAINT "Clinica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicaHistorial" (
    "id" SERIAL NOT NULL,
    "clinicaId" INTEGER NOT NULL,
    "valorAnterior" TEXT,
    "valorNuevo" TEXT,
    "userId" INTEGER NOT NULL,
    "fechaCambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicaHistorial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "valor" TEXT,
    "userId" INTEGER,
    "equipoId" INTEGER NOT NULL,

    CONSTRAINT "Activos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivosHistorial" (
    "id" SERIAL NOT NULL,
    "ActivosId" INTEGER NOT NULL,
    "valorAnterior" TEXT,
    "valorNuevo" TEXT,
    "userId" INTEGER NOT NULL,
    "fechaCambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivosHistorial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ClinicaImage" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_ActivosImage" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ClinicaImage_AB_unique" ON "_ClinicaImage"("A", "B");

-- CreateIndex
CREATE INDEX "_ClinicaImage_B_index" ON "_ClinicaImage"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ActivosImage_AB_unique" ON "_ActivosImage"("A", "B");

-- CreateIndex
CREATE INDEX "_ActivosImage_B_index" ON "_ActivosImage"("B");

-- AddForeignKey
ALTER TABLE "Clinica" ADD CONSTRAINT "Clinica_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clinica" ADD CONSTRAINT "Clinica_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "Equipo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicaHistorial" ADD CONSTRAINT "ClinicaHistorial_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicaHistorial" ADD CONSTRAINT "ClinicaHistorial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activos" ADD CONSTRAINT "Activos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activos" ADD CONSTRAINT "Activos_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "Equipo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivosHistorial" ADD CONSTRAINT "ActivosHistorial_ActivosId_fkey" FOREIGN KEY ("ActivosId") REFERENCES "Activos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivosHistorial" ADD CONSTRAINT "ActivosHistorial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClinicaImage" ADD CONSTRAINT "_ClinicaImage_A_fkey" FOREIGN KEY ("A") REFERENCES "Clinica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClinicaImage" ADD CONSTRAINT "_ClinicaImage_B_fkey" FOREIGN KEY ("B") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActivosImage" ADD CONSTRAINT "_ActivosImage_A_fkey" FOREIGN KEY ("A") REFERENCES "Activos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActivosImage" ADD CONSTRAINT "_ActivosImage_B_fkey" FOREIGN KEY ("B") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;
