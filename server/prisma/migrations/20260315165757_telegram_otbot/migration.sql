-- CreateTable
CREATE TABLE "TelegramUser" (
    "id" SERIAL NOT NULL,
    "telegramId" TEXT NOT NULL,
    "nombre" TEXT,
    "username" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OTBot" (
    "id" SERIAL NOT NULL,
    "otNumero" TEXT,
    "descripcionOT" TEXT,
    "zona" TEXT,
    "ubicacion" TEXT,
    "avance" DOUBLE PRECISION,
    "responsable" TEXT,
    "estado" TEXT DEFAULT 'BORRADOR',
    "telegramUserId" INTEGER NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualiza" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OTBot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OTConsumibleBot" (
    "id" SERIAL NOT NULL,
    "otBotId" INTEGER NOT NULL,
    "consumibleId" INTEGER,
    "consumibleSap" TEXT,
    "nombreConsumible" TEXT,
    "unidadMedida" TEXT,
    "cantidad" DOUBLE PRECISION,
    "comentarios" TEXT,
    "estado" TEXT,
    "reservaSap" TEXT,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OTConsumibleBot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramUser_telegramId_key" ON "TelegramUser"("telegramId");

-- AddForeignKey
ALTER TABLE "OTBot" ADD CONSTRAINT "OTBot_telegramUserId_fkey" FOREIGN KEY ("telegramUserId") REFERENCES "TelegramUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OTConsumibleBot" ADD CONSTRAINT "OTConsumibleBot_otBotId_fkey" FOREIGN KEY ("otBotId") REFERENCES "OTBot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OTConsumibleBot" ADD CONSTRAINT "OTConsumibleBot_consumibleId_fkey" FOREIGN KEY ("consumibleId") REFERENCES "Consumible"("id") ON DELETE SET NULL ON UPDATE CASCADE;
