const crypto = require("node:crypto");
const prisma = require("./prisma");
const { readFirstSheet, checksum } = require("../services/excelImportService");

const value = (row, ...keys) => {
  for (const key of keys) if (row[key] !== undefined && row[key] !== null && row[key] !== "") return row[key];
  return null;
};
const text = (input) => input == null ? null : String(input).trim() || null;
const number = (input) => {
  const parsed = Number(input);
  return Number.isFinite(parsed) ? parsed : 0;
};
const parseDate = (input) => {
  if (!input) return null;
  if (input instanceof Date && !Number.isNaN(input.getTime())) return input;
  if (typeof input === "number") {
    const excelDate = new Date(Date.UTC(1899, 11, 30) + input * 86400000);
    return Number.isNaN(excelDate.getTime()) ? null : excelDate;
  }
  const match = String(input).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const parsed = match
    ? new Date(Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1])))
    : new Date(input);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const sourceSignature = (row) => [
  row.otNumero.toUpperCase(),
  row.codigoMaterial.toUpperCase(),
  row.reservaSAP || "",
  row.fechaPedido?.toISOString() || "",
].join("|");
const stableKey = (row, occurrence) => crypto
  .createHash("sha256")
  .update(`${sourceSignature(row)}|${occurrence}`)
  .digest("hex");

const importExcel = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Selecciona un archivo XLSX." });
  const mode = String(req.body.modo || "MERGE").trim().toUpperCase();
  if (!["MERGE", "SNAPSHOT"].includes(mode)) return res.status(400).json({ error: "El modo debe ser MERGE o SNAPSHOT." });
  const rows = await readFirstSheet(req.file.buffer);
  if (!rows.length) return res.status(400).json({ error: "El Excel está vacío." });
  const season = req.body.temporadaId
    ? await prisma.temporada.findUnique({ where: { id: Number(req.body.temporadaId) } })
    : await prisma.temporada.findFirst({ where: { activa: true } });
  if (!season) return res.status(400).json({ error: "Selecciona o activa una temporada antes de importar." });

  const digest = checksum(req.file.buffer);
  const duplicate = await prisma.importacion.findFirst({ where: { tipo: "MOVIMIENTOS_SAP", checksum: digest, estado: "COMPLETADA" } });
  if (duplicate) return res.status(409).json({ error: "Este mismo archivo ya fue importado.", importacionId: duplicate.id });
  const log = await prisma.importacion.create({ data: { usuarioId: req.user.id, tipo: "MOVIMIENTOS_SAP", nombreArchivo: req.file.originalname, checksum: digest } });

  let created = 0;
  let updated = 0;
  const errors = [];
  const incomingKeys = [];
  const incomingOts = new Set();
  const signatureCounts = new Map();
  const usedExistingIds = new Set();
  try {
    for (const { rowNumber, data } of rows) {
      try {
        const item = {
          otNumero: text(value(data, "otnumero", "ot_numero", "ot")),
          descripcionOT: text(value(data, "descripcionot", "descripcion_ot")),
          zona: text(data.zona),
          ubicacion: text(data.ubicacion),
          comentarioOT: text(value(data, "comentarioot", "comentario_ot")),
          codigoMaterial: text(value(data, "codigomaterial", "codigo_material", "sap")),
          nombreMaterial: text(value(data, "nombrematerial", "nombre_material")),
          unidadMedida: text(value(data, "unidadmedida", "unidad_medida", "um")),
          cantidad: number(data.cantidad),
          reservaSAP: text(value(data, "reservasap", "reserva_sap", "reserva")),
          comentario: text(data.comentario),
          fechaPedido: parseDate(value(data, "fechapedido", "fecha_pedido")),
          temporadaId: season.id,
        };
        if (!item.otNumero || !item.codigoMaterial || item.cantidad < 0) throw new Error("OT, código de material y cantidad válida son obligatorios");
        const signature = sourceSignature(item);
        const occurrence = (signatureCounts.get(signature) || 0) + 1;
        signatureCounts.set(signature, occurrence);
        item.claveOrigen = stableKey(item, occurrence);
        incomingKeys.push(item.claveOrigen);
        incomingOts.add(item.otNumero);
        let existing = await prisma.oTMovimientoSAP.findFirst({ where: { claveOrigen: item.claveOrigen }, select: { id: true } });
        if (!existing) {
          existing = await prisma.oTMovimientoSAP.findFirst({
            where: {
              otNumero: item.otNumero,
              codigoMaterial: item.codigoMaterial,
              reservaSAP: item.reservaSAP,
              fechaPedido: item.fechaPedido,
              ...(usedExistingIds.size ? { id: { notIn: [...usedExistingIds] } } : {}),
            },
            select: { id: true },
            orderBy: { id: "asc" },
          });
        }
        if (existing) {
          await prisma.oTMovimientoSAP.update({ where: { id: existing.id }, data: item });
          usedExistingIds.add(existing.id);
          updated += 1;
        } else {
          await prisma.oTMovimientoSAP.create({ data: item });
          created += 1;
        }
      } catch (error) {
        errors.push({ fila: rowNumber, error: String(error.message).slice(0, 300) });
      }
    }

    let removed = 0;
    let snapshotAplicado = false;
    if (mode === "SNAPSHOT" && incomingKeys.length && errors.length === 0) {
      const result = await prisma.oTMovimientoSAP.deleteMany({
        where: {
          temporadaId: season.id,
          otNumero: { in: [...incomingOts] },
          claveOrigen: { notIn: incomingKeys },
        },
      });
      removed = result.count;
      snapshotAplicado = true;
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
    res.json({
      importacionId: log.id,
      temporada: season.codigo,
      modo: mode,
      snapshotAplicado,
      advertencia: mode === "SNAPSHOT" && errors.length ? "No se eliminaron registros porque hubo filas con error." : null,
      leidos: rows.length,
      creados: created,
      actualizados: updated,
      eliminados: removed,
      errores: errors,
    });
  } catch (error) {
    await prisma.importacion.update({ where: { id: log.id }, data: { estado: "FALLIDA", errores: [{ error: error.message }], completedAt: new Date() } });
    throw error;
  }
};

const getAllMovimientos = async (req, res) => {
  const where = {};
  if (req.query.zona) where.zona = { equals: String(req.query.zona), mode: "insensitive" };
  if (req.query.ubicacion) where.ubicacion = { equals: String(req.query.ubicacion), mode: "insensitive" };
  if (req.query.ot) where.otNumero = { equals: String(req.query.ot), mode: "insensitive" };
  if (req.query.temporadaId) where.temporadaId = Number(req.query.temporadaId);
  res.json(await prisma.oTMovimientoSAP.findMany({ where, include: { temporada: true }, orderBy: { id: "desc" }, take: 5000 }));
};

const getMovimientosByOT = async (req, res) => {
  res.json(await prisma.oTMovimientoSAP.findMany({ where: { otNumero: String(req.params.otNumero) }, include: { temporada: true }, orderBy: { id: "desc" } }));
};

module.exports = { importExcel, getAllMovimientos, getMovimientosByOT };
