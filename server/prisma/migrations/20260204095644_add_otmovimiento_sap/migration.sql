-- CreateTable
CREATE TABLE "OTMovimientoSAP" (
    "id" SERIAL NOT NULL,
    "otNumero" TEXT NOT NULL,
    "descripcionOT" TEXT,
    "zona" TEXT,
    "ubicacion" TEXT,
    "comentarioOT" TEXT,
    "codigoMaterial" TEXT NOT NULL,
    "nombreMaterial" TEXT,
    "unidadMedida" TEXT,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "reservaSAP" TEXT,
    "comentario" TEXT,
    "fechaPedido" TIMESTAMP(3),

    CONSTRAINT "OTMovimientoSAP_pkey" PRIMARY KEY ("id")
);
