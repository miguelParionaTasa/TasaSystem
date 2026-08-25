const { AsyncLocalStorage } = require("node:async_hooks");

const tenantStorage = new AsyncLocalStorage();

const CROSS_PLANT_READ_ROLES = new Set([
  "SUPER_ADMIN",
  "ADMIN_PLANTA",
  "SUPERVISOR",
]);

const parsePositiveInt = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const tenantContextMiddleware = (req, res, next) => {
  const ownPlantId = Number(req.user.plantaId);
  const requestedPlantId = parsePositiveInt(
    req.query.plantaId || req.header("X-Planta-Id")
  );
  const isRead = req.method === "GET" || req.method === "HEAD";
  const canReadOtherPlants = CROSS_PLANT_READ_ROLES.has(req.user.rol);
  const canWriteOtherPlants = req.user.rol === "SUPER_ADMIN";

  if (
    requestedPlantId &&
    requestedPlantId !== ownPlantId &&
    !((isRead && canReadOtherPlants) || (!isRead && canWriteOtherPlants))
  ) {
    return res.status(403).json({
      error: "No tienes permiso para operar sobre la planta seleccionada.",
    });
  }

  const plantaId = requestedPlantId || ownPlantId;
  req.plantaId = plantaId;

  return tenantStorage.run(
    {
      plantaId,
      usuarioId: req.user.id,
      rol: req.user.rol,
      origen: "WEB",
    },
    next
  );
};

const getTenantContext = () => tenantStorage.getStore();

module.exports = {
  tenantStorage,
  getTenantContext,
  tenantContextMiddleware,
  CROSS_PLANT_READ_ROLES,
};
