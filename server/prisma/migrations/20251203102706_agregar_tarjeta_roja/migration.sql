-- CreateTable
CREATE TABLE "TarjetaRoja" (
    "id" SERIAL NOT NULL,
    "reporta" TEXT NOT NULL,
    "dniReporta" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pet" TEXT,
    "zona" TEXT,
    "equipo" TEXT,
    "componente" TEXT,
    "descripcion" TEXT,
    "tipoDeteccion" TEXT,
    "comentario1" TEXT,
    "comentario2" TEXT,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TarjetaRoja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TarjetaRojaHistorial" (
    "id" SERIAL NOT NULL,
    "tarjetaId" INTEGER NOT NULL,
    "campo" TEXT NOT NULL,
    "valorAnterior" TEXT,
    "valorNuevo" TEXT,
    "userId" INTEGER NOT NULL,
    "fechaCambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TarjetaRojaHistorial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TarjetaRojaImage" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_TarjetaRojaImage_AB_unique" ON "_TarjetaRojaImage"("A", "B");

-- CreateIndex
CREATE INDEX "_TarjetaRojaImage_B_index" ON "_TarjetaRojaImage"("B");

-- AddForeignKey
ALTER TABLE "TarjetaRoja" ADD CONSTRAINT "TarjetaRoja_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarjetaRojaHistorial" ADD CONSTRAINT "TarjetaRojaHistorial_tarjetaId_fkey" FOREIGN KEY ("tarjetaId") REFERENCES "TarjetaRoja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarjetaRojaHistorial" ADD CONSTRAINT "TarjetaRojaHistorial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TarjetaRojaImage" ADD CONSTRAINT "_TarjetaRojaImage_A_fkey" FOREIGN KEY ("A") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TarjetaRojaImage" ADD CONSTRAINT "_TarjetaRojaImage_B_fkey" FOREIGN KEY ("B") REFERENCES "TarjetaRoja"("id") ON DELETE CASCADE ON UPDATE CASCADE;
