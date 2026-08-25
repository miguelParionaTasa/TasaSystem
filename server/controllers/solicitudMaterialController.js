const prisma = require("./prisma");
const { createMaterialRequest } = require("../services/solicitudMaterialService");
const { notifyRequestStatus } = require("../services/telegramNotificationService");

const include = {
  detalles: true,
  temporada: { select: { id: true, codigo: true } },
  zona: { select: { id: true, name: true } },
  ubicacion: { select: { id: true, name: true } },
  activo: { select: { id: true, codigoActivo: true, nombre: true } },
  solicitante: { select: { id: true, firstName: true, lastName: true, username: true } },
  atendidoPor: { select: { id: true, firstName: true, lastName: true } },
  telegramAcceso: { select: { id: true, telegramIdEncrypted: true } },
};

const create = async (req, res) => {
  const request = await createMaterialRequest({
    ...req.body,
    plantaId: req.plantaId,
    solicitanteId: req.user.id,
    origen: "WEB",
    telegramAccesoId: null,
  });
  res.status(201).json(request);
};

const list = async (req, res) => {
  const where = {};
  if (req.query.origen) where.origen = String(req.query.origen).toUpperCase();
  if (req.query.estado) where.estado = String(req.query.estado).toUpperCase();
  if (req.query.otNumero) where.otNumero = { contains: String(req.query.otNumero), mode: "insensitive" };
  if (req.query.temporadaId) where.temporadaId = Number(req.query.temporadaId);
  if (req.query.mias === "true") where.solicitanteId = req.user.id;
  const requests = await prisma.solicitudMaterial.findMany({ where, include, orderBy: { fechaCreacion: "desc" }, take: 500 });
  res.json(requests);
};

const getById = async (req, res) => {
  const request = await prisma.solicitudMaterial.findUnique({ where: { id: Number(req.params.id) }, include });
  if (!request) return res.status(404).json({ error: "Solicitud no encontrada." });
  res.json(request);
};

const updateStatus = async (req, res) => {
  const allowed = ["PENDIENTE", "REVISADO", "RESERVADO", "ENTREGADO", "RECHAZADO", "CANCELADO"];
  const estado = String(req.body.estado || "").toUpperCase();
  if (!allowed.includes(estado)) return res.status(400).json({ error: "Estado inválido." });
  const data = { estado, atendidoPorId: req.user.id };
  if (req.body.observacion !== undefined) data.observacion = String(req.body.observacion || "").trim() || null;
  const request = await prisma.solicitudMaterial.update({
    where: { id: Number(req.params.id) },
    data: { ...data, detalles: { updateMany: { where: {}, data: { estado } } } },
    include,
  });
  const telegramNotificado = request.origen === "TELEGRAM" ? await notifyRequestStatus(request) : false;
  res.json({ ...request, telegramNotificado });
};

module.exports = { create, list, getById, updateStatus };
