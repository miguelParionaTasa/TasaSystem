const { getTenantContext } = require("./tenantContext");

const TENANT_MODELS = new Set([
  "User",
  "Zona",
  "Ubicacion",
  "Equipo",
  "Ots",
  "OTConsumible",
  "OTMovimientoSAP",
  "Lubricacion",
  "Activo",
  "OTbasico",
  "Historico",
  "InventarioItem",
  "Configuracion",
  "Predictivo",
  "Procesos",
  "TarjetaRoja",
  "OTBot",
  "Temporada",
  "TelegramAcceso",
  "SolicitudMaterial",
  "Importacion",
  "Componente",
  "Atributo",
  "Clinica",
  "Repuesto",
  "ActivoHistorial",
  "AtributoHistorial",
  "ClinicaHistorial",
  "HistorialItem",
  "ProcesosHistorial",
  "TarjetaRojaHistorial",
  "OTConsumibleBot",
]);

const READ_ACTIONS = new Set([
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
]);

const mergePlantWhere = (where, plantaId) => ({
  ...(where || {}),
  plantaId,
});

const prismaTenantMiddleware = async (params, next) => {
  const context = getTenantContext();

  if (!context || !TENANT_MODELS.has(params.model)) {
    return next(params);
  }

  const { plantaId, allowPlantTransfer = false } = context;
  params.args = params.args || {};

  if (params.action === "findUnique") {
    params.action = "findFirst";
    params.args.where = mergePlantWhere(params.args.where, plantaId);
  } else if (params.action === "findUniqueOrThrow") {
    params.action = "findFirstOrThrow";
    params.args.where = mergePlantWhere(params.args.where, plantaId);
  } else if (READ_ACTIONS.has(params.action)) {
    params.args.where = mergePlantWhere(params.args.where, plantaId);
  } else if (params.action === "create") {
    params.args.data = { ...(params.args.data || {}), plantaId };
  } else if (params.action === "createMany") {
    const rows = Array.isArray(params.args.data)
      ? params.args.data
      : [params.args.data];
    params.args.data = rows.map((row) => ({ ...row, plantaId }));
  } else if (["update", "delete", "updateMany", "deleteMany"].includes(params.action)) {
    params.args.where = mergePlantWhere(params.args.where, plantaId);
    if (!allowPlantTransfer && ["update", "updateMany"].includes(params.action)) {
      params.args.data = { ...(params.args.data || {}), plantaId };
    }
  } else if (params.action === "upsert") {
    params.args.where = mergePlantWhere(params.args.where, plantaId);
    params.args.create = { ...(params.args.create || {}), plantaId };
    if (!allowPlantTransfer) params.args.update = { ...(params.args.update || {}), plantaId };
  }

  return next(params);
};

module.exports = { prismaTenantMiddleware, TENANT_MODELS };
