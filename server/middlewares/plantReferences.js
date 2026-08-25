const prisma = require("../controllers/prisma");

const REFERENCE_MODELS = {
  zonaId: "zona",
  ubicacionId: "ubicacion",
  equipoId: "equipo",
  otId: "ots",
  otBotId: "oTBot",
  activoId: "activo",
  temporadaId: "temporada",
  inventarioId: "inventarioItem",
  componenteId: "componente",
  atributoId: "atributo",
  procesoId: "procesos",
  tarjetaId: "tarjetaRoja",
  solicitudId: "solicitudMaterial",
  telegramAccesoId: "telegramAcceso",
  responsableId: "user",
};

const validatePlantReferenceBody = async (req) => {
  if (!req.user || !req.body || !["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return;
  for (const [field, delegate] of Object.entries(REFERENCE_MODELS)) {
    if (req.body[field] === undefined || req.body[field] === null || req.body[field] === "") continue;
    const id = Number(req.body[field]);
    if (!Number.isInteger(id) || id <= 0) throw Object.assign(new Error(`${field} no es válido.`), { status: 400 });
    const exists = await prisma[delegate].findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw Object.assign(new Error(`${field} no pertenece a la planta seleccionada.`), { status: 400 });
  }
};

const validatePlantReferences = async (req, res, next) => {
  try {
    await validatePlantReferenceBody(req);
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { validatePlantReferences, validatePlantReferenceBody };
