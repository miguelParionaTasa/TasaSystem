-- CreateTable
CREATE TABLE "Historico" (
    "id" SERIAL NOT NULL,
    "zonaId" INTEGER NOT NULL,
    "ubicacionId" INTEGER NOT NULL,
    "consumibleId" INTEGER NOT NULL,
    "trabajo" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "ot" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Historico_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Historico" ADD CONSTRAINT "Historico_zonaId_fkey" FOREIGN KEY ("zonaId") REFERENCES "Zona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Historico" ADD CONSTRAINT "Historico_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Historico" ADD CONSTRAINT "Historico_consumibleId_fkey" FOREIGN KEY ("consumibleId") REFERENCES "Consumible"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
