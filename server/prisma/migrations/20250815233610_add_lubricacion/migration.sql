-- CreateTable
CREATE TABLE "Lubricacion" (
    "id" SERIAL NOT NULL,
    "zona" TEXT NOT NULL,
    "equipo" TEXT NOT NULL,
    "item" INTEGER NOT NULL,
    "componente" TEXT NOT NULL,
    "puntosLubricar" INTEGER NOT NULL,
    "cantidad" TEXT NOT NULL,
    "lubricante" TEXT NOT NULL,
    "frecuencia" TEXT NOT NULL,
    "actividad" TEXT NOT NULL,
    "ubicacionTexto" TEXT,
    "ubicacionId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lubricacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_LubricacionImage" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_LubricacionImage_AB_unique" ON "_LubricacionImage"("A", "B");

-- CreateIndex
CREATE INDEX "_LubricacionImage_B_index" ON "_LubricacionImage"("B");

-- AddForeignKey
ALTER TABLE "Lubricacion" ADD CONSTRAINT "Lubricacion_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LubricacionImage" ADD CONSTRAINT "_LubricacionImage_A_fkey" FOREIGN KEY ("A") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LubricacionImage" ADD CONSTRAINT "_LubricacionImage_B_fkey" FOREIGN KEY ("B") REFERENCES "Lubricacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
