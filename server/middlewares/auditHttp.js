const crypto = require("node:crypto");
const { writeAudit, sanitize } = require("../services/auditService");

const shouldAudit = (req) =>
  ["POST", "PUT", "PATCH", "DELETE"].includes(req.method) ||
  req.path.includes("exportar") ||
  req.path.includes("auditoria");

const auditHttp = (req, res, next) => {
  req.requestId = req.header("X-Request-Id") || crypto.randomUUID();
  res.setHeader("X-Request-Id", req.requestId);

  if (!shouldAudit(req)) return next();

  const startedAt = Date.now();
  res.on("finish", () => {
    const segments = req.path.split("/").filter(Boolean);
    const entityId = segments.find((segment) => /^\d+$/.test(segment)) || null;

    void writeAudit({
      requestId: req.requestId,
      usuarioId: req.user?.id || null,
      plantaId: req.plantaId || req.user?.plantaId || null,
      rol: req.user?.rol || null,
      origen: "WEB",
      accion: `${req.method}_${segments[0] || "API"}`,
      metodo: req.method,
      ruta: req.originalUrl.split("?")[0],
      entidad: segments[0] || null,
      entidadId: entityId,
      estadoHttp: res.statusCode,
      exitoso: res.statusCode < 400,
      ip: req.ip,
      userAgent: req.get("user-agent") || null,
      detalle: {
        query: sanitize(req.query),
        body: sanitize(req.body),
        duracionMs: Date.now() - startedAt,
      },
    });
  });

  return next();
};

module.exports = auditHttp;
