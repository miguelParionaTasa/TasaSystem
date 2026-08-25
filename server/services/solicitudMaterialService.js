const crypto = require("node:crypto");
const prisma = require("../controllers/prisma");
const { tenantStorage } = require("../security/tenantContext");
const { writeAudit } = require("./auditService");

const normalizeDetails = (details) => {
  if (!Array.isArray(details) || details.length < 1 || details.length > 50) {
    throw Object.assign(new Error("Incluye entre 1 y 50 materiales."), { status: 400 });
  }
  return details.map((item, index) => {
    const nombreMaterial = String(item.nombreMaterial || item.nombre || "").trim();
    const cantidad = Number(item.cantidad);
    if (!nombreMaterial || !Number.isFinite(cantidad) || cantidad <= 0) {
      throw Object.assign(new Error(`Material inválido en la fila ${index + 1}.`), { status: 400 });
    }
    return {
      consumibleId: item.consumibleId ? Number(item.consumibleId) : null,
      codigoMaterial: item.codigoMaterial || item.codMaximo
        ? String(item.codigoMaterial || item.codMaximo).trim()
        : null,
      nombreMaterial,
      unidadMedida: item.unidadMedida ? String(item.unidadMedida).trim() : null,
      cantidad,
      comentario: item.comentario ? String(item.comentario).trim() : null,
    };
  });
};

const buildCode = () =>
  `SM-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

const createMaterialRequest = async ({
  plantaId,
  solicitanteId,
  telegramAccesoId = null,
  origen,
  otNumero,
  descripcionOT = null,
  temporadaId = null,
  zonaId = null,
  ubicacionId = null,
  activoId = null,
  observacion = null,
  detalles,
}) => {
  const plant = Number(plantaId);
  const requester = Number(solicitanteId);
  const ot = String(otNumero || "").trim();
  if (!plant || !requester || !ot) {
    throw Object.assign(new Error("Planta, solicitante y OT son obligatorios."), { status: 400 });
  }
  const normalizedDetails = normalizeDetails(detalles);

  return tenantStorage.run(
    { plantaId: plant, usuarioId: requester, rol: "TECNICO_OPERADOR", origen },
    async () => {
      const [user, season, zone, location, asset] = await Promise.all([
        prisma.user.findUnique({ where: { id: requester }, select: { id: true } }),
        temporadaId ? prisma.temporada.findUnique({ where: { id: Number(temporadaId) }, select: { id: true } }) : null,
        zonaId ? prisma.zona.findUnique({ where: { id: Number(zonaId) }, select: { id: true } }) : null,
        ubicacionId ? prisma.ubicacion.findUnique({ where: { id: Number(ubicacionId) }, select: { id: true } }) : null,
        activoId ? prisma.activo.findUnique({ where: { id: Number(activoId) }, select: { id: true } }) : null,
      ]);
      if (!user || (temporadaId && !season) || (zonaId && !zone) || (ubicacionId && !location) || (activoId && !asset)) {
        throw Object.assign(new Error("Una referencia no pertenece a la planta seleccionada."), { status: 400 });
      }

      const created = await prisma.solicitudMaterial.create({
        data: {
          codigo: buildCode(),
          temporadaId: season?.id || null,
          otNumero: ot,
          descripcionOT: descripcionOT ? String(descripcionOT).trim() : null,
          zonaId: zone?.id || null,
          ubicacionId: location?.id || null,
          activoId: asset?.id || null,
          solicitanteId: requester,
          telegramAccesoId,
          origen,
          observacion: observacion ? String(observacion).trim() : null,
          detalles: { create: normalizedDetails },
        },
        include: { detalles: true, temporada: true, solicitante: { select: { id: true, firstName: true, lastName: true } } },
      });

      await writeAudit({
        usuarioId: requester,
        plantaId: plant,
        origen,
        accion: "SOLICITUD_MATERIAL_CREADA",
        entidad: "SolicitudMaterial",
        entidadId: created.id,
        datosDespues: { codigo: created.codigo, otNumero: created.otNumero, origen, materiales: normalizedDetails.length },
      });
      return created;
    }
  );
};

module.exports = { createMaterialRequest, normalizeDetails };
