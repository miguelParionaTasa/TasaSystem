-- CreateTable
CREATE TABLE "Predictivo" (
    "id" SERIAL NOT NULL,
    "zonaId" INTEGER NOT NULL,
    "ubicacionId" INTEGER NOT NULL,
    "equipoId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tecnica" TEXT NOT NULL,
    "recomendacionProveedor" TEXT,
    "recomendacionPredictivo" TEXT,
    "otGenerado" TEXT,
    "comentario" TEXT,
    "otRelacionada" TEXT,

    CONSTRAINT "Predictivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PredictivoImage" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PredictivoImage_AB_unique" ON "_PredictivoImage"("A", "B");

-- CreateIndex
CREATE INDEX "_PredictivoImage_B_index" ON "_PredictivoImage"("B");

-- AddForeignKey
ALTER TABLE "Predictivo" ADD CONSTRAINT "Predictivo_zonaId_fkey" FOREIGN KEY ("zonaId") REFERENCES "Zona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Predictivo" ADD CONSTRAINT "Predictivo_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Predictivo" ADD CONSTRAINT "Predictivo_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "Equipo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PredictivoImage" ADD CONSTRAINT "_PredictivoImage_A_fkey" FOREIGN KEY ("A") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PredictivoImage" ADD CONSTRAINT "_PredictivoImage_B_fkey" FOREIGN KEY ("B") REFERENCES "Predictivo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
