-- CreateTable
CREATE TABLE "Procesos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "valor" TEXT,
    "userId" INTEGER,
    "equipoId" INTEGER NOT NULL,

    CONSTRAINT "Procesos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcesosHistorial" (
    "id" SERIAL NOT NULL,
    "procesoId" INTEGER NOT NULL,
    "valorAnterior" TEXT,
    "valorNuevo" TEXT,
    "userId" INTEGER NOT NULL,
    "fechaCambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcesosHistorial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProcesosImage" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ProcesosImage_AB_unique" ON "_ProcesosImage"("A", "B");

-- CreateIndex
CREATE INDEX "_ProcesosImage_B_index" ON "_ProcesosImage"("B");

-- AddForeignKey
ALTER TABLE "Procesos" ADD CONSTRAINT "Procesos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Procesos" ADD CONSTRAINT "Procesos_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "Equipo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcesosHistorial" ADD CONSTRAINT "ProcesosHistorial_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "Procesos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcesosHistorial" ADD CONSTRAINT "ProcesosHistorial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProcesosImage" ADD CONSTRAINT "_ProcesosImage_A_fkey" FOREIGN KEY ("A") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProcesosImage" ADD CONSTRAINT "_ProcesosImage_B_fkey" FOREIGN KEY ("B") REFERENCES "Procesos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
