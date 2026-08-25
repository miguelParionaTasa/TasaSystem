const prisma = require("../controllers/prisma");

const ROUTE_MODELS = [
  { prefix: "activos", delegate: "activo" },
  { prefix: "atributos", delegate: "atributo" },
  { prefix: "clinicas", delegate: "clinica" },
  { prefix: "predictivos", delegate: "predictivo" },
  { prefix: "procesos", delegate: "procesos" },
  { prefix: "tarjeta-roja", delegate: "tarjetaRoja" },
  { prefix: "lubricacion", delegate: "lubricacion" },
];

const validateScopedUploadParent = async (req, res, next) => {
  if (!["POST", "PUT"].includes(req.method) || !/(upload|imagen)/i.test(req.path)) return next();
  const match = ROUTE_MODELS.find(({ prefix }) => req.path.startsWith(`/${prefix}/`));
  if (!match) return next();
  const idMatch = req.path.slice(match.prefix.length + 2).match(/^(\d+)/);
  if (!idMatch) return next();
  try {
    const parent = await prisma[match.delegate].findUnique({ where: { id: Number(idMatch[1]) }, select: { id: true } });
    if (!parent) return res.status(404).json({ error: "Registro no encontrado en la planta seleccionada." });
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = validateScopedUploadParent;
