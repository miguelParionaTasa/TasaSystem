const path = require("node:path");
const prisma = require("./prisma");
const { readFirstSheet, checksum } = require("../services/excelImportService");

const TEMPLATE_PATH = path.join(__dirname, "..", "templates", "Plantilla_Importacion_Activos.xlsx");
const text = (value) => value == null ? null : String(value).trim() || null;

const findReference = async ({ zona, ubicacion, equipo }) => {
  const zoneName = text(zona);
  const locationName = text(ubicacion);
  const equipmentCode = text(equipo);
  const warnings = [];
  let zone = zoneName
    ? await prisma.zona.findFirst({ where: { OR: [{ name: { equals: zoneName, mode: "insensitive" } }, { nombreMaximo: { equals: zoneName, mode: "insensitive" } }] } })
    : null;
  if (zoneName && !zone) warnings.push(`Zona no homologada; se conservó como texto: ${zoneName}`);

  let location = null;
  if (locationName) {
    if (zoneName && !zone) {
      warnings.push(`Ubicación sin mapear porque la zona no fue homologada: ${locationName}`);
    } else {
      const locations = await prisma.ubicacion.findMany({
        where: {
          ...(zone ? { zonaId: zone.id } : {}),
          OR: [{ name: { equals: locationName, mode: "insensitive" } }, { nombreMaximo: { equals: locationName, mode: "insensitive" } }],
        },
        take: 2,
      });
      if (locations.length === 1) location = locations[0];
      else warnings.push(`${locations.length ? "Ubicación ambigua" : "Ubicación no homologada"}; se conservó como texto: ${locationName}`);
    }
  }
  if (!zone && location) zone = await prisma.zona.findUnique({ where: { id: location.zonaId } });

  let equipment = null;
  if (equipmentCode) {
    if ((zoneName && !zone) || (locationName && !location)) {
      warnings.push(`Equipo sin mapear porque su zona o ubicación no fue homologada: ${equipmentCode}`);
    } else {
      const equipments = await prisma.equipo.findMany({
        where: {
          ...(zone ? { zonaId: zone.id } : {}),
          ...(location ? { ubicacionId: location.id } : {}),
          OR: [{ nombreMaximo: { equals: equipmentCode, mode: "insensitive" } }, { name: { equals: equipmentCode, mode: "insensitive" } }],
        },
        take: 2,
      });
      if (equipments.length === 1) equipment = equipments[0];
      else warnings.push(`${equipments.length ? "Equipo ambiguo" : "Equipo no homologado"}; el activo quedó sin equipo: ${equipmentCode}`);
    }
  }
  if (!location && equipment?.ubicacionId) location = await prisma.ubicacion.findUnique({ where: { id: equipment.ubicacionId } });
  if (!zone && equipment?.zonaId) zone = await prisma.zona.findUnique({ where: { id: equipment.zonaId } });
  return { zone, location, equipment, warnings };
};

const downloadTemplate = (req, res) => res.download(TEMPLATE_PATH, "Plantilla_Importacion_Activos.xlsx");

const importAssets = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Selecciona un archivo XLSX." });
  const digest = checksum(req.file.buffer);
  const duplicate = await prisma.importacion.findFirst({ where: { checksum: digest, tipo: "ACTIVOS", estado: "COMPLETADA" } });
  if (duplicate) {
    return res.status(409).json({ error: "Este mismo archivo ya fue importado en la planta seleccionada.", importacionId: duplicate.id });
  }

  const log = await prisma.importacion.create({
    data: { usuarioId: req.user.id, tipo: "ACTIVOS", nombreArchivo: req.file.originalname, checksum: digest },
  });

  try {
    const rows = await readFirstSheet(req.file.buffer);
    if (!rows.length) throw Object.assign(new Error("El Excel no contiene filas de activos."), { status: 400 });
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors = [];
    const warnings = [];
    const seen = new Set();

    for (const { rowNumber, data } of rows) {
      try {
        const codigoActivo = text(data.codigo_activo || data.codigoactivo);
        const nombre = text(data.nombre || data.nombre_activo);
        if (!codigoActivo || !nombre) throw new Error("codigo_activo y nombre son obligatorios");
        if (seen.has(codigoActivo.toUpperCase())) {
          skipped += 1;
          errors.push({ fila: rowNumber, error: "Código repetido dentro del archivo" });
          continue;
        }
        seen.add(codigoActivo.toUpperCase());

        const zoneText = text(data.zona);
        const locationText = text(data.ubicacion);
        const equipmentText = text(data.codigo_equipo_maximo || data.equipo);
        const { zone, location, equipment, warnings: rowWarnings } = await findReference({
          zona: zoneText,
          ubicacion: locationText,
          equipo: equipmentText,
        });
        warnings.push(...rowWarnings.map((warning) => ({ fila: rowNumber, advertencia: warning })));
        const existing = await prisma.activo.findFirst({ where: { codigoActivo: { equals: codigoActivo, mode: "insensitive" } }, select: { id: true } });
        const assetData = {
          codigoActivo,
          nombre,
          userId: req.user.id,
        };
        for (const [field, source] of [
          ["valor", data.valor],
          ["valor2", data.valor_2 ?? data.valor2],
          ["marca", data.marca],
          ["modelo", data.modelo],
          ["serie", data.serie],
          ["historial", data.historial],
        ]) {
          const normalized = text(source);
          if (normalized !== null) assetData[field] = normalized;
        }
        if (zoneText !== null) {
          assetData.zona = zoneText;
          assetData.zonaId = zone?.id || null;
        }
        if (locationText !== null) {
          assetData.ubicacion = locationText;
          assetData.ubicacionId = location?.id || null;
        }
        if (equipmentText !== null) {
          assetData.equipoId = equipment?.id || null;
          if (equipment) {
            assetData.zonaId = zone?.id || equipment.zonaId || null;
            assetData.ubicacionId = location?.id || equipment.ubicacionId || null;
          }
        }
        if (existing) {
          await prisma.activo.update({ where: { id: existing.id }, data: assetData });
          updated += 1;
        } else {
          await prisma.activo.create({ data: assetData });
          created += 1;
        }
      } catch (error) {
        errors.push({ fila: rowNumber, error: String(error.message).slice(0, 300) });
      }
    }

    await prisma.importacion.update({
      where: { id: log.id },
      data: {
        estado: errors.length ? "COMPLETADA_CON_ERRORES" : "COMPLETADA",
        registrosLeidos: rows.length,
        registrosCreados: created,
        registrosActualizados: updated,
        registrosOmitidos: skipped,
        registrosError: errors.length,
        errores: [...errors, ...warnings].slice(0, 200),
        completedAt: new Date(),
      },
    });
    return res.json({ importacionId: log.id, leidos: rows.length, creados: created, actualizados: updated, omitidos: skipped, errores: errors, advertencias: warnings });
  } catch (error) {
    await prisma.importacion.update({
      where: { id: log.id },
      data: { estado: "FALLIDA", errores: [{ error: String(error.message).slice(0, 500) }], completedAt: new Date() },
    });
    throw error;
  }
};

module.exports = { downloadTemplate, importAssets };
