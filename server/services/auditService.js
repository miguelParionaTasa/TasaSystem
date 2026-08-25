const crypto = require("node:crypto");
const prisma = require("../controllers/prisma");

const isSensitiveKey = (key) =>
  /(password|contrasena|contraseña|token|authorization|jwt|secret|api[_-]?key|telegramid)/i.test(String(key));

const sanitize = (value, depth = 0) => {
  if (depth > 5) return "[LIMITE_PROFUNDIDAD]";
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => sanitize(item, depth + 1));
  if (typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      isSensitiveKey(key) ? "[PROTEGIDO]" : sanitize(item, depth + 1),
    ])
  );
};

const writeAudit = async ({
  requestId = crypto.randomUUID(),
  usuarioId = null,
  plantaId = null,
  rol = null,
  origen = "SISTEMA",
  accion,
  metodo = null,
  ruta = null,
  entidad = null,
  entidadId = null,
  estadoHttp = null,
  exitoso = true,
  ip = null,
  userAgent = null,
  datosAntes = null,
  datosDespues = null,
  detalle = null,
  error = null,
}) => {
  try {
    await prisma.auditoria.create({
      data: {
        requestId,
        usuarioId,
        plantaId,
        rol,
        origen,
        accion,
        metodo,
        ruta,
        entidad,
        entidadId: entidadId === null ? null : String(entidadId),
        estadoHttp,
        exitoso,
        ip,
        userAgent,
        datosAntes: sanitize(datosAntes),
        datosDespues: sanitize(datosDespues),
        detalle: sanitize(detalle),
        error: error ? String(error).slice(0, 1000) : null,
      },
    });
  } catch (auditError) {
    console.error("No se pudo escribir auditoría:", auditError.message);
  }
};

module.exports = { writeAudit, sanitize };
