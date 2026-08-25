const prisma = require("./prisma");
const { readFirstSheet, checksum } = require("../services/excelImportService");
const { createMaterialRequest } = require("../services/solicitudMaterialService");

const safeJson = (data) => JSON.parse(JSON.stringify(data, (_, item) => typeof item === "bigint" ? item.toString() : item));
const text = (value) => value == null ? null : String(value).trim() || null;
const pick = (row, ...keys) => {
  for (const key of keys) if (row[key] !== undefined && row[key] !== null && row[key] !== "") return row[key];
  return null;
};

const importExcelOTBot = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Selecciona un archivo XLSX." });
  const rows = await readFirstSheet(req.file.buffer);
  if (!rows.length) return res.status(400).json({ error: "El Excel está vacío." });
  const season = req.body.temporadaId
    ? await prisma.temporada.findUnique({ where: { id: Number(req.body.temporadaId) } })
    : await prisma.temporada.findFirst({ where: { activa: true } });
  if (!season) return res.status(400).json({ error: "Selecciona o activa una temporada antes de importar." });

  const digest = checksum(req.file.buffer);
  const duplicate = await prisma.importacion.findFirst({ where: { tipo: "OTS_TELEGRAM", checksum: digest, estado: "COMPLETADA" } });
  if (duplicate) return res.status(409).json({ error: "Este mismo archivo ya fue importado.", importacionId: duplicate.id });
  const log = await prisma.importacion.create({ data: { usuarioId: req.user.id, tipo: "OTS_TELEGRAM", nombreArchivo: req.file.originalname, checksum: digest } });
  let created = 0;
  let updated = 0;
  const errors = [];
  try {
    for (const { rowNumber, data } of rows) {
      try {
        const otNumero = text(pick(data, "otnumero", "ot_numero", "ot"));
        if (!otNumero) throw new Error("La OT es obligatoria");
        const item = {
          otNumero,
          descripcionOT: text(pick(data, "descripcionot", "descripcion_ot", "descripcion")),
          zona: text(data.zona),
          ubicacion: text(data.ubicacion),
          avance: Number(pick(data, "avance", "porcentaje_avance") || 0),
          estado: text(data.estado) || "WAPPR",
          responsable: text(data.responsable),
          temporadaId: season.id,
        };
        if (!Number.isFinite(item.avance) || item.avance < 0 || item.avance > 100) throw new Error("El avance debe estar entre 0 y 100");
        const existing = await prisma.oTBot.findFirst({ where: { otNumero }, select: { id: true } });
        if (existing) {
          await prisma.oTBot.update({ where: { id: existing.id }, data: item });
          updated += 1;
        } else {
          await prisma.oTBot.create({ data: item });
          created += 1;
        }
      } catch (error) {
        errors.push({ fila: rowNumber, error: String(error.message).slice(0, 300) });
      }
    }
    await prisma.importacion.update({ where: { id: log.id }, data: {
      estado: errors.length ? "COMPLETADA_CON_ERRORES" : "COMPLETADA",
      registrosLeidos: rows.length,
      registrosCreados: created,
      registrosActualizados: updated,
      registrosError: errors.length,
      errores: errors.slice(0, 200),
      completedAt: new Date(),
    } });
    res.json({ importacionId: log.id, temporada: season.codigo, leidos: rows.length, creados: created, actualizados: updated, errores: errors });
  } catch (error) {
    await prisma.importacion.update({ where: { id: log.id }, data: { estado: "FALLIDA", errores: [{ error: error.message }], completedAt: new Date() } });
    throw error;
  }
};

const getAllOTBot = async (req, res) => {
  const where = req.query.temporadaId ? { temporadaId: Number(req.query.temporadaId) } : {};
  res.json(safeJson(await prisma.oTBot.findMany({ where, include: { temporada: true }, orderBy: { id: "desc" }, take: 5000 })));
};

const getOTByNumero = async (req, res) => {
  const ot = await prisma.oTBot.findFirst({ where: { otNumero: String(req.params.otNumero) }, include: { temporada: true } });
  if (!ot) return res.status(404).json({ error: "OT no encontrada." });
  res.json(safeJson(ot));
};

const asignarOT = (req, res) => res.status(410).json({ error: "La asignación por ID crudo fue retirada. Vincula Telegram desde Administración." });

const crearOTConsumible = async (req, res) => {
  const ot = await prisma.oTBot.findFirst({ where: { otNumero: String(req.body.otNumero || "") } });
  if (!ot) return res.status(404).json({ error: "OT no encontrada." });
  const created = await createMaterialRequest({
    plantaId: req.plantaId,
    solicitanteId: req.user.id,
    origen: "WEB",
    temporadaId: ot.temporadaId,
    otNumero: ot.otNumero,
    descripcionOT: ot.descripcionOT,
    detalles: [{
      nombreMaterial: req.body.material || req.body.nombreMaterial,
      cantidad: req.body.cantidad,
      unidadMedida: req.body.unidadMedida,
      codigoMaterial: req.body.codMaximo || req.body.codigoMaterial,
    }],
  });
  res.status(201).json(created);
};

const obtenerOTConsumibles = async (req, res) => {
  res.json(await prisma.solicitudMaterial.findMany({ include: { detalles: true, solicitante: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { fechaCreacion: "desc" } }));
};

module.exports = { importExcelOTBot, getAllOTBot, getOTByNumero, asignarOT, crearOTConsumible, obtenerOTConsumibles };
