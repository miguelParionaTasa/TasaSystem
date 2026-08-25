-- Migración aditiva para seguridad, multi-planta, temporadas, auditoría y Telegram.
-- Todos los registros existentes se asignan inicialmente a PISCO_SUR.

CREATE TYPE "RolUsuario" AS ENUM (
  'SUPER_ADMIN',
  'ADMIN_PLANTA',
  'SUPERVISOR',
  'TECNICO_OPERADOR',
  'ALMACEN',
  'CONSULTA',
  'AUDITOR'
);

CREATE TYPE "OrigenSolicitud" AS ENUM ('WEB', 'TELEGRAM');
CREATE TYPE "EstadoSolicitudMaterial" AS ENUM (
  'PENDIENTE',
  'REVISADO',
  'RESERVADO',
  'ENTREGADO',
  'RECHAZADO',
  'CANCELADO'
);
CREATE TYPE "EstadoImportacion" AS ENUM (
  'PROCESANDO',
  'COMPLETADA',
  'COMPLETADA_CON_ERRORES',
  'FALLIDA'
);

-- El esquema histórico declaró estos IDs como BigInt, pero la migración original
-- los creó como INTEGER. La conversión conserva los valores y alinea Prisma/BD.
ALTER TABLE "OTBot" DROP CONSTRAINT "OTBot_telegramUserId_fkey";
ALTER TABLE "TelegramUser" ALTER COLUMN "id" TYPE BIGINT USING "id"::BIGINT;
ALTER TABLE "OTBot"
  ALTER COLUMN "telegramUserId" TYPE BIGINT USING "telegramUserId"::BIGINT,
  ALTER COLUMN "telegramUserId" DROP NOT NULL;
ALTER TABLE "OTBot" ADD CONSTRAINT "OTBot_telegramUserId_fkey"
  FOREIGN KEY ("telegramUserId") REFERENCES "TelegramUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "Planta" (
  "id" SERIAL NOT NULL,
  "codigo" TEXT NOT NULL,
  "nombre" TEXT NOT NULL,
  "activa" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Planta_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Planta_codigo_key" ON "Planta"("codigo");
INSERT INTO "Planta" ("codigo", "nombre") VALUES ('PISCO_SUR', 'Pisco Sur');

CREATE TABLE "Temporada" (
  "id" SERIAL NOT NULL,
  "plantaId" INTEGER NOT NULL,
  "tipo" TEXT NOT NULL DEFAULT 'CHIV',
  "numero" INTEGER NOT NULL,
  "anio" INTEGER NOT NULL,
  "codigo" TEXT NOT NULL,
  "activa" BOOLEAN NOT NULL DEFAULT false,
  "fechaInicio" TIMESTAMP(3),
  "fechaFin" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Temporada_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Temporada_plantaId_codigo_key" ON "Temporada"("plantaId", "codigo");
CREATE UNIQUE INDEX "Temporada_plantaId_tipo_numero_anio_key" ON "Temporada"("plantaId", "tipo", "numero", "anio");
CREATE INDEX "Temporada_plantaId_activa_idx" ON "Temporada"("plantaId", "activa");
ALTER TABLE "Temporada" ADD CONSTRAINT "Temporada_tipo_check" CHECK ("tipo" = 'CHIV');
ALTER TABLE "Temporada" ADD CONSTRAINT "Temporada_numero_check" CHECK ("numero" IN (1, 2));
ALTER TABLE "Temporada" ADD CONSTRAINT "Temporada_anio_check" CHECK ("anio" BETWEEN 2000 AND 2100);
ALTER TABLE "Temporada" ADD CONSTRAINT "Temporada_plantaId_fkey"
  FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "User"
  ADD COLUMN "rol" "RolUsuario" NOT NULL DEFAULT 'TECNICO_OPERADOR',
  ADD COLUMN "plantaId" INTEGER,
  ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "passwordChangedAt" TIMESTAMP(3),
  ADD COLUMN "ultimoAcceso" TIMESTAMP(3),
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "User" SET "plantaId" = (SELECT "id" FROM "Planta" WHERE "codigo" = 'PISCO_SUR');
UPDATE "User" SET "rol" = 'SUPER_ADMIN', "isAdmin" = true WHERE "id" = 1;
UPDATE "User" SET "rol" = 'ADMIN_PLANTA', "isAdmin" = true WHERE "id" IN (2, 3);
ALTER TABLE "User" ALTER COLUMN "plantaId" SET NOT NULL;
ALTER TABLE "User" ADD CONSTRAINT "User_plantaId_fkey"
  FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "User_plantaId_rol_isDeleted_idx" ON "User"("plantaId", "rol", "isDeleted");

ALTER TABLE "Zona" ADD COLUMN "plantaId" INTEGER;
ALTER TABLE "Ubicacion" ADD COLUMN "plantaId" INTEGER;
ALTER TABLE "Equipo" ADD COLUMN "plantaId" INTEGER;
ALTER TABLE "Ots" ADD COLUMN "plantaId" INTEGER, ADD COLUMN "temporadaId" INTEGER;
ALTER TABLE "OTConsumible" ADD COLUMN "plantaId" INTEGER;
ALTER TABLE "OTMovimientoSAP"
  ADD COLUMN "plantaId" INTEGER,
  ADD COLUMN "temporadaId" INTEGER,
  ADD COLUMN "claveOrigen" TEXT;
ALTER TABLE "Lubricacion" ADD COLUMN "plantaId" INTEGER;
ALTER TABLE "Activo"
  ADD COLUMN "codigoActivo" TEXT,
  ADD COLUMN "plantaId" INTEGER,
  ADD COLUMN "zonaId" INTEGER,
  ADD COLUMN "ubicacionId" INTEGER;
ALTER TABLE "OTbasico" ADD COLUMN "plantaId" INTEGER, ADD COLUMN "temporadaId" INTEGER;
ALTER TABLE "Historico" ADD COLUMN "plantaId" INTEGER;
ALTER TABLE "InventarioItem" ADD COLUMN "plantaId" INTEGER;
ALTER TABLE "Configuracion" ADD COLUMN "plantaId" INTEGER;
ALTER TABLE "Predictivo" ADD COLUMN "plantaId" INTEGER;
ALTER TABLE "Procesos" ADD COLUMN "plantaId" INTEGER;
ALTER TABLE "TarjetaRoja" ADD COLUMN "plantaId" INTEGER;
ALTER TABLE "OTBot" ADD COLUMN "plantaId" INTEGER, ADD COLUMN "temporadaId" INTEGER;
ALTER TABLE "Image" ADD COLUMN "tipo" TEXT;
ALTER TABLE "Componente" ADD COLUMN "plantaId" INTEGER;
ALTER TABLE "Atributo" ADD COLUMN "plantaId" INTEGER;
ALTER TABLE "Clinica" ADD COLUMN "plantaId" INTEGER;
ALTER TABLE "Repuesto" ADD COLUMN "plantaId" INTEGER;
ALTER TABLE "ActivoHistorial" ADD COLUMN "plantaId" INTEGER;
ALTER TABLE "AtributoHistorial" ADD COLUMN "plantaId" INTEGER;
ALTER TABLE "ClinicaHistorial" ADD COLUMN "plantaId" INTEGER;
ALTER TABLE "HistorialItem" ADD COLUMN "plantaId" INTEGER;
ALTER TABLE "ProcesosHistorial" ADD COLUMN "plantaId" INTEGER;
ALTER TABLE "TarjetaRojaHistorial" ADD COLUMN "plantaId" INTEGER;
ALTER TABLE "OTConsumibleBot" ADD COLUMN "plantaId" INTEGER;

UPDATE "Zona" SET "plantaId" = (SELECT "id" FROM "Planta" WHERE "codigo" = 'PISCO_SUR');
UPDATE "Ubicacion" SET "plantaId" = (SELECT "id" FROM "Planta" WHERE "codigo" = 'PISCO_SUR');
UPDATE "Equipo" SET "plantaId" = (SELECT "id" FROM "Planta" WHERE "codigo" = 'PISCO_SUR');
UPDATE "Ots" SET "plantaId" = (SELECT "id" FROM "Planta" WHERE "codigo" = 'PISCO_SUR');
UPDATE "OTConsumible" SET "plantaId" = (SELECT "id" FROM "Planta" WHERE "codigo" = 'PISCO_SUR');
UPDATE "OTMovimientoSAP" SET
  "plantaId" = (SELECT "id" FROM "Planta" WHERE "codigo" = 'PISCO_SUR'),
  "claveOrigen" = 'LEGACY:' || "id"::TEXT;
UPDATE "Lubricacion" SET "plantaId" = (SELECT "id" FROM "Planta" WHERE "codigo" = 'PISCO_SUR');
UPDATE "Activo" SET "plantaId" = (SELECT "id" FROM "Planta" WHERE "codigo" = 'PISCO_SUR');
UPDATE "OTbasico" SET "plantaId" = (SELECT "id" FROM "Planta" WHERE "codigo" = 'PISCO_SUR');
UPDATE "Historico" SET "plantaId" = (SELECT "id" FROM "Planta" WHERE "codigo" = 'PISCO_SUR');
UPDATE "InventarioItem" SET "plantaId" = (SELECT "id" FROM "Planta" WHERE "codigo" = 'PISCO_SUR');
UPDATE "Configuracion" SET "plantaId" = (SELECT "id" FROM "Planta" WHERE "codigo" = 'PISCO_SUR');
UPDATE "Predictivo" SET "plantaId" = (SELECT "id" FROM "Planta" WHERE "codigo" = 'PISCO_SUR');
UPDATE "Procesos" SET "plantaId" = (SELECT "id" FROM "Planta" WHERE "codigo" = 'PISCO_SUR');
UPDATE "TarjetaRoja" SET "plantaId" = (SELECT "id" FROM "Planta" WHERE "codigo" = 'PISCO_SUR');
UPDATE "OTBot" SET "plantaId" = (SELECT "id" FROM "Planta" WHERE "codigo" = 'PISCO_SUR');
UPDATE "Componente" AS c SET "plantaId" = e."plantaId" FROM "Equipo" AS e WHERE c."equipoId" = e."id";
UPDATE "Atributo" AS a SET "plantaId" = e."plantaId" FROM "Equipo" AS e WHERE a."equipoId" = e."id";
UPDATE "Clinica" AS c SET "plantaId" = u."plantaId" FROM "Ubicacion" AS u WHERE c."ubicacionId" = u."id";
UPDATE "Repuesto" AS r SET "plantaId" = c."plantaId" FROM "Componente" AS c WHERE r."componenteId" = c."id";
UPDATE "ActivoHistorial" AS h SET "plantaId" = a."plantaId" FROM "Activo" AS a WHERE h."activoId" = a."id";
UPDATE "AtributoHistorial" AS h SET "plantaId" = a."plantaId" FROM "Atributo" AS a WHERE h."atributoId" = a."id";
UPDATE "ClinicaHistorial" AS h SET "plantaId" = c."plantaId" FROM "Clinica" AS c WHERE h."clinicaId" = c."id";
UPDATE "HistorialItem" AS h SET "plantaId" = i."plantaId" FROM "InventarioItem" AS i WHERE h."inventarioId" = i."id";
UPDATE "ProcesosHistorial" AS h SET "plantaId" = p."plantaId" FROM "Procesos" AS p WHERE h."procesoId" = p."id";
UPDATE "TarjetaRojaHistorial" AS h SET "plantaId" = t."plantaId" FROM "TarjetaRoja" AS t WHERE h."tarjetaId" = t."id";
UPDATE "OTConsumibleBot" AS c SET "plantaId" = o."plantaId" FROM "OTBot" AS o WHERE c."otBotId" = o."id";

ALTER TABLE "Zona" ALTER COLUMN "plantaId" SET NOT NULL;
ALTER TABLE "Ubicacion" ALTER COLUMN "plantaId" SET NOT NULL;
ALTER TABLE "Equipo" ALTER COLUMN "plantaId" SET NOT NULL;
ALTER TABLE "Ots" ALTER COLUMN "plantaId" SET NOT NULL;
ALTER TABLE "OTConsumible" ALTER COLUMN "plantaId" SET NOT NULL;
ALTER TABLE "OTMovimientoSAP" ALTER COLUMN "plantaId" SET NOT NULL, ALTER COLUMN "claveOrigen" SET NOT NULL;
ALTER TABLE "Lubricacion" ALTER COLUMN "plantaId" SET NOT NULL;
ALTER TABLE "Activo" ALTER COLUMN "plantaId" SET NOT NULL;
ALTER TABLE "OTbasico" ALTER COLUMN "plantaId" SET NOT NULL;
ALTER TABLE "Historico" ALTER COLUMN "plantaId" SET NOT NULL;
ALTER TABLE "InventarioItem" ALTER COLUMN "plantaId" SET NOT NULL;
ALTER TABLE "Configuracion" ALTER COLUMN "plantaId" SET NOT NULL;
ALTER TABLE "Predictivo" ALTER COLUMN "plantaId" SET NOT NULL;
ALTER TABLE "Procesos" ALTER COLUMN "plantaId" SET NOT NULL;
ALTER TABLE "TarjetaRoja" ALTER COLUMN "plantaId" SET NOT NULL;
ALTER TABLE "OTBot" ALTER COLUMN "plantaId" SET NOT NULL;
ALTER TABLE "Componente" ALTER COLUMN "plantaId" SET NOT NULL;
ALTER TABLE "Atributo" ALTER COLUMN "plantaId" SET NOT NULL;
ALTER TABLE "Clinica" ALTER COLUMN "plantaId" SET NOT NULL;
ALTER TABLE "Repuesto" ALTER COLUMN "plantaId" SET NOT NULL;
ALTER TABLE "ActivoHistorial" ALTER COLUMN "plantaId" SET NOT NULL;
ALTER TABLE "AtributoHistorial" ALTER COLUMN "plantaId" SET NOT NULL;
ALTER TABLE "ClinicaHistorial" ALTER COLUMN "plantaId" SET NOT NULL;
ALTER TABLE "HistorialItem" ALTER COLUMN "plantaId" SET NOT NULL;
ALTER TABLE "ProcesosHistorial" ALTER COLUMN "plantaId" SET NOT NULL;
ALTER TABLE "TarjetaRojaHistorial" ALTER COLUMN "plantaId" SET NOT NULL;
ALTER TABLE "OTConsumibleBot" ALTER COLUMN "plantaId" SET NOT NULL;

ALTER TABLE "Zona" ADD CONSTRAINT "Zona_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ubicacion" ADD CONSTRAINT "Ubicacion_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Equipo" ADD CONSTRAINT "Equipo_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ots" ADD CONSTRAINT "Ots_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ots" ADD CONSTRAINT "Ots_temporadaId_fkey" FOREIGN KEY ("temporadaId") REFERENCES "Temporada"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OTConsumible" ADD CONSTRAINT "OTConsumible_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OTMovimientoSAP" ADD CONSTRAINT "OTMovimientoSAP_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OTMovimientoSAP" ADD CONSTRAINT "OTMovimientoSAP_temporadaId_fkey" FOREIGN KEY ("temporadaId") REFERENCES "Temporada"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lubricacion" ADD CONSTRAINT "Lubricacion_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Activo" ADD CONSTRAINT "Activo_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Activo" ADD CONSTRAINT "Activo_zonaId_fkey" FOREIGN KEY ("zonaId") REFERENCES "Zona"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Activo" ADD CONSTRAINT "Activo_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OTbasico" ADD CONSTRAINT "OTbasico_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OTbasico" ADD CONSTRAINT "OTbasico_temporadaId_fkey" FOREIGN KEY ("temporadaId") REFERENCES "Temporada"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Historico" ADD CONSTRAINT "Historico_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventarioItem" ADD CONSTRAINT "InventarioItem_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Configuracion" ADD CONSTRAINT "Configuracion_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Predictivo" ADD CONSTRAINT "Predictivo_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Procesos" ADD CONSTRAINT "Procesos_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TarjetaRoja" ADD CONSTRAINT "TarjetaRoja_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OTBot" ADD CONSTRAINT "OTBot_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OTBot" ADD CONSTRAINT "OTBot_temporadaId_fkey" FOREIGN KEY ("temporadaId") REFERENCES "Temporada"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Componente" ADD CONSTRAINT "Componente_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Atributo" ADD CONSTRAINT "Atributo_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Clinica" ADD CONSTRAINT "Clinica_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Repuesto" ADD CONSTRAINT "Repuesto_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ActivoHistorial" ADD CONSTRAINT "ActivoHistorial_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AtributoHistorial" ADD CONSTRAINT "AtributoHistorial_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClinicaHistorial" ADD CONSTRAINT "ClinicaHistorial_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HistorialItem" ADD CONSTRAINT "HistorialItem_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProcesosHistorial" ADD CONSTRAINT "ProcesosHistorial_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TarjetaRojaHistorial" ADD CONSTRAINT "TarjetaRojaHistorial_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OTConsumibleBot" ADD CONSTRAINT "OTConsumibleBot_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Ots" DROP CONSTRAINT "Ots_ottId_fkey";
DROP INDEX "OTbasico_OTmaximo_key";
CREATE UNIQUE INDEX "OTbasico_plantaId_OTmaximo_key" ON "OTbasico"("plantaId", "OTmaximo");
ALTER TABLE "Ots" ADD CONSTRAINT "Ots_plantaId_ottId_fkey"
  FOREIGN KEY ("plantaId", "ottId") REFERENCES "OTbasico"("plantaId", "OTmaximo") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX "OTBot_otNumero_key";
CREATE UNIQUE INDEX "OTBot_plantaId_otNumero_key" ON "OTBot"("plantaId", "otNumero");
CREATE UNIQUE INDEX "OTMovimientoSAP_plantaId_claveOrigen_key" ON "OTMovimientoSAP"("plantaId", "claveOrigen");
CREATE UNIQUE INDEX "Activo_plantaId_codigoActivo_key" ON "Activo"("plantaId", "codigoActivo");
CREATE UNIQUE INDEX "Configuracion_plantaId_key" ON "Configuracion"("plantaId");

CREATE INDEX "Zona_plantaId_name_idx" ON "Zona"("plantaId", "name");
CREATE INDEX "Ubicacion_plantaId_zonaId_name_idx" ON "Ubicacion"("plantaId", "zonaId", "name");
CREATE INDEX "Equipo_plantaId_nombreMaximo_idx" ON "Equipo"("plantaId", "nombreMaximo");
CREATE INDEX "Equipo_plantaId_zonaId_ubicacionId_idx" ON "Equipo"("plantaId", "zonaId", "ubicacionId");
CREATE INDEX "Ots_plantaId_temporadaId_idx" ON "Ots"("plantaId", "temporadaId");
CREATE INDEX "Ots_plantaId_ottId_idx" ON "Ots"("plantaId", "ottId");
CREATE INDEX "OTConsumible_plantaId_fechaCreacion_idx" ON "OTConsumible"("plantaId", "fechaCreacion");
CREATE INDEX "OTMovimientoSAP_plantaId_temporadaId_otNumero_idx" ON "OTMovimientoSAP"("plantaId", "temporadaId", "otNumero");
CREATE INDEX "OTMovimientoSAP_codigoMaterial_idx" ON "OTMovimientoSAP"("codigoMaterial");
CREATE INDEX "Activo_plantaId_zonaId_ubicacionId_idx" ON "Activo"("plantaId", "zonaId", "ubicacionId");
CREATE INDEX "OTbasico_plantaId_temporadaId_estado_idx" ON "OTbasico"("plantaId", "temporadaId", "estado");
CREATE INDEX "Historico_plantaId_zonaId_fecha_idx" ON "Historico"("plantaId", "zonaId", "fecha");
CREATE INDEX "InventarioItem_plantaId_estado_idx" ON "InventarioItem"("plantaId", "estado");
CREATE INDEX "Predictivo_plantaId_zonaId_fecha_idx" ON "Predictivo"("plantaId", "zonaId", "fecha");
CREATE INDEX "Procesos_plantaId_ubicacionId_idx" ON "Procesos"("plantaId", "ubicacionId");
CREATE INDEX "TarjetaRoja_plantaId_fecha_idx" ON "TarjetaRoja"("plantaId", "fecha");
CREATE INDEX "OTBot_plantaId_temporadaId_estado_idx" ON "OTBot"("plantaId", "temporadaId", "estado");
CREATE INDEX "Componente_plantaId_equipoId_idx" ON "Componente"("plantaId", "equipoId");
CREATE INDEX "Atributo_plantaId_equipoId_idx" ON "Atributo"("plantaId", "equipoId");
CREATE INDEX "Clinica_plantaId_ubicacionId_idx" ON "Clinica"("plantaId", "ubicacionId");
CREATE INDEX "Repuesto_plantaId_componenteId_idx" ON "Repuesto"("plantaId", "componenteId");
CREATE INDEX "ActivoHistorial_plantaId_activoId_idx" ON "ActivoHistorial"("plantaId", "activoId");
CREATE INDEX "AtributoHistorial_plantaId_atributoId_idx" ON "AtributoHistorial"("plantaId", "atributoId");
CREATE INDEX "ClinicaHistorial_plantaId_clinicaId_idx" ON "ClinicaHistorial"("plantaId", "clinicaId");
CREATE INDEX "HistorialItem_plantaId_inventarioId_idx" ON "HistorialItem"("plantaId", "inventarioId");
CREATE INDEX "ProcesosHistorial_plantaId_procesoId_idx" ON "ProcesosHistorial"("plantaId", "procesoId");
CREATE INDEX "TarjetaRojaHistorial_plantaId_tarjetaId_idx" ON "TarjetaRojaHistorial"("plantaId", "tarjetaId");
CREATE INDEX "OTConsumibleBot_plantaId_otBotId_fechaCreacion_idx" ON "OTConsumibleBot"("plantaId", "otBotId", "fechaCreacion");

-- Convertir Configuracion.id a autoincremental sin cambiar el registro existente.
CREATE SEQUENCE "Configuracion_id_seq";
SELECT setval('"Configuracion_id_seq"', GREATEST(COALESCE((SELECT MAX("id") FROM "Configuracion"), 1), 1));
ALTER TABLE "Configuracion" ALTER COLUMN "id" SET DEFAULT nextval('"Configuracion_id_seq"');
ALTER SEQUENCE "Configuracion_id_seq" OWNED BY "Configuracion"."id";

-- Registrar las temporadas históricas CHIV1/CHIV2 detectables en OTbasico.Temp.
INSERT INTO "Temporada" ("plantaId", "tipo", "numero", "anio", "codigo")
SELECT DISTINCT
  "plantaId",
  'CHIV',
  SUBSTRING(UPPER(REPLACE("Temp", ' ', '')) FROM 5 FOR 1)::INTEGER,
  2000 + SUBSTRING(UPPER(REPLACE("Temp", ' ', '')) FROM 7 FOR 2)::INTEGER,
  UPPER(REPLACE("Temp", ' ', ''))
FROM "OTbasico"
WHERE UPPER(REPLACE("Temp", ' ', '')) ~ '^CHIV[12]-[0-9]{2}$'
ON CONFLICT ("plantaId", "codigo") DO NOTHING;

WITH ordenadas AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "plantaId" ORDER BY "anio" DESC, "numero" DESC, "id" DESC) AS posicion
  FROM "Temporada"
)
UPDATE "Temporada" AS t SET "activa" = true
FROM ordenadas AS o WHERE t."id" = o."id" AND o.posicion = 1;

CREATE UNIQUE INDEX "Temporada_una_activa_por_planta_key" ON "Temporada"("plantaId") WHERE "activa" = true;

UPDATE "OTbasico" AS ob
SET "temporadaId" = t."id"
FROM "Temporada" AS t
WHERE t."plantaId" = ob."plantaId"
  AND t."codigo" = UPPER(REPLACE(ob."Temp", ' ', ''));

UPDATE "Ots" AS o
SET "temporadaId" = ob."temporadaId"
FROM "OTbasico" AS ob
WHERE o."plantaId" = ob."plantaId" AND o."ottId" = ob."OTmaximo";

CREATE TABLE "TelegramAcceso" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER,
  "plantaId" INTEGER NOT NULL,
  "telegramIdHash" TEXT NOT NULL,
  "telegramIdEncrypted" TEXT NOT NULL,
  "telegramIdUltimos4" TEXT NOT NULL,
  "nombreTelegram" TEXT,
  "usernameTelegram" TEXT,
  "activo" BOOLEAN NOT NULL DEFAULT false,
  "aprobadoPorId" INTEGER,
  "aprobadoEn" TIMESTAMP(3),
  "ultimoUso" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TelegramAcceso_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TelegramAcceso_userId_key" ON "TelegramAcceso"("userId");
CREATE UNIQUE INDEX "TelegramAcceso_telegramIdHash_key" ON "TelegramAcceso"("telegramIdHash");
CREATE INDEX "TelegramAcceso_plantaId_activo_idx" ON "TelegramAcceso"("plantaId", "activo");
ALTER TABLE "TelegramAcceso" ADD CONSTRAINT "TelegramAcceso_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TelegramAcceso" ADD CONSTRAINT "TelegramAcceso_aprobadoPorId_fkey" FOREIGN KEY ("aprobadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TelegramAcceso" ADD CONSTRAINT "TelegramAcceso_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "SolicitudMaterial" (
  "id" SERIAL NOT NULL,
  "codigo" TEXT NOT NULL,
  "plantaId" INTEGER NOT NULL,
  "temporadaId" INTEGER,
  "otNumero" TEXT NOT NULL,
  "descripcionOT" TEXT,
  "zonaId" INTEGER,
  "ubicacionId" INTEGER,
  "activoId" INTEGER,
  "solicitanteId" INTEGER NOT NULL,
  "atendidoPorId" INTEGER,
  "telegramAccesoId" INTEGER,
  "origen" "OrigenSolicitud" NOT NULL,
  "estado" "EstadoSolicitudMaterial" NOT NULL DEFAULT 'PENDIENTE',
  "observacion" TEXT,
  "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fechaActualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SolicitudMaterial_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SolicitudMaterial_codigo_key" ON "SolicitudMaterial"("codigo");
CREATE INDEX "SolicitudMaterial_plantaId_origen_estado_fechaCreacion_idx" ON "SolicitudMaterial"("plantaId", "origen", "estado", "fechaCreacion");
CREATE INDEX "SolicitudMaterial_plantaId_otNumero_idx" ON "SolicitudMaterial"("plantaId", "otNumero");
ALTER TABLE "SolicitudMaterial" ADD CONSTRAINT "SolicitudMaterial_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SolicitudMaterial" ADD CONSTRAINT "SolicitudMaterial_temporadaId_fkey" FOREIGN KEY ("temporadaId") REFERENCES "Temporada"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SolicitudMaterial" ADD CONSTRAINT "SolicitudMaterial_zonaId_fkey" FOREIGN KEY ("zonaId") REFERENCES "Zona"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SolicitudMaterial" ADD CONSTRAINT "SolicitudMaterial_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SolicitudMaterial" ADD CONSTRAINT "SolicitudMaterial_activoId_fkey" FOREIGN KEY ("activoId") REFERENCES "Activo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SolicitudMaterial" ADD CONSTRAINT "SolicitudMaterial_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SolicitudMaterial" ADD CONSTRAINT "SolicitudMaterial_atendidoPorId_fkey" FOREIGN KEY ("atendidoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SolicitudMaterial" ADD CONSTRAINT "SolicitudMaterial_telegramAccesoId_fkey" FOREIGN KEY ("telegramAccesoId") REFERENCES "TelegramAcceso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "SolicitudMaterialDetalle" (
  "id" SERIAL NOT NULL,
  "solicitudId" INTEGER NOT NULL,
  "consumibleId" INTEGER,
  "codigoMaterial" TEXT,
  "nombreMaterial" TEXT NOT NULL,
  "unidadMedida" TEXT,
  "cantidad" DOUBLE PRECISION NOT NULL,
  "reservaSap" TEXT,
  "estado" "EstadoSolicitudMaterial" NOT NULL DEFAULT 'PENDIENTE',
  "comentario" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SolicitudMaterialDetalle_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SolicitudMaterialDetalle_solicitudId_idx" ON "SolicitudMaterialDetalle"("solicitudId");
CREATE INDEX "SolicitudMaterialDetalle_codigoMaterial_idx" ON "SolicitudMaterialDetalle"("codigoMaterial");
ALTER TABLE "SolicitudMaterialDetalle" ADD CONSTRAINT "SolicitudMaterialDetalle_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "SolicitudMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SolicitudMaterialDetalle" ADD CONSTRAINT "SolicitudMaterialDetalle_consumibleId_fkey" FOREIGN KEY ("consumibleId") REFERENCES "Consumible"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "Auditoria" (
  "id" BIGSERIAL NOT NULL,
  "requestId" TEXT NOT NULL,
  "usuarioId" INTEGER,
  "plantaId" INTEGER,
  "rol" TEXT,
  "origen" TEXT NOT NULL,
  "accion" TEXT NOT NULL,
  "metodo" TEXT,
  "ruta" TEXT,
  "entidad" TEXT,
  "entidadId" TEXT,
  "estadoHttp" INTEGER,
  "exitoso" BOOLEAN NOT NULL,
  "ip" TEXT,
  "userAgent" TEXT,
  "datosAntes" JSONB,
  "datosDespues" JSONB,
  "detalle" JSONB,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Auditoria_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Auditoria_plantaId_createdAt_idx" ON "Auditoria"("plantaId", "createdAt");
CREATE INDEX "Auditoria_usuarioId_createdAt_idx" ON "Auditoria"("usuarioId", "createdAt");
CREATE INDEX "Auditoria_accion_createdAt_idx" ON "Auditoria"("accion", "createdAt");
CREATE INDEX "Auditoria_requestId_idx" ON "Auditoria"("requestId");
ALTER TABLE "Auditoria" ADD CONSTRAINT "Auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Auditoria" ADD CONSTRAINT "Auditoria_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION "proteger_auditoria_append_only"()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Auditoria es append-only: UPDATE y DELETE no están permitidos';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Auditoria_append_only"
BEFORE UPDATE OR DELETE ON "Auditoria"
FOR EACH ROW EXECUTE FUNCTION "proteger_auditoria_append_only"();

CREATE TABLE "Importacion" (
  "id" SERIAL NOT NULL,
  "plantaId" INTEGER NOT NULL,
  "usuarioId" INTEGER NOT NULL,
  "tipo" TEXT NOT NULL,
  "nombreArchivo" TEXT NOT NULL,
  "checksum" TEXT,
  "estado" "EstadoImportacion" NOT NULL DEFAULT 'PROCESANDO',
  "registrosLeidos" INTEGER NOT NULL DEFAULT 0,
  "registrosCreados" INTEGER NOT NULL DEFAULT 0,
  "registrosActualizados" INTEGER NOT NULL DEFAULT 0,
  "registrosOmitidos" INTEGER NOT NULL DEFAULT 0,
  "registrosError" INTEGER NOT NULL DEFAULT 0,
  "errores" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "Importacion_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Importacion_plantaId_tipo_createdAt_idx" ON "Importacion"("plantaId", "tipo", "createdAt");
ALTER TABLE "Importacion" ADD CONSTRAINT "Importacion_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Importacion" ADD CONSTRAINT "Importacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
