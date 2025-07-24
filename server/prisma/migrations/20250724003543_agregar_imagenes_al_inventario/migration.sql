-- CreateTable
CREATE TABLE "InventarioItem" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "estado" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "fechaIngreso" TIMESTAMP(3) NOT NULL,
    "fechaSalida" TIMESTAMP(3),
    "destino" TEXT,
    "responsable" TEXT NOT NULL,
    "imageId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventarioItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialItem" (
    "id" SERIAL NOT NULL,
    "inventarioId" INTEGER NOT NULL,
    "fechaUso" TIMESTAMP(3) NOT NULL,
    "cantidadUsada" INTEGER NOT NULL,
    "descripcionUso" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "responsable" TEXT NOT NULL,

    CONSTRAINT "HistorialItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "InventarioItem" ADD CONSTRAINT "InventarioItem_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialItem" ADD CONSTRAINT "HistorialItem_inventarioId_fkey" FOREIGN KEY ("inventarioId") REFERENCES "InventarioItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
