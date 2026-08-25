const { env } = require("../config/env");

const securityHeaders = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cache-Control", "no-store");
  if (env.nodeEnv === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
};

const validateMutationOrigin = (req, res, next) => {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
  const origin = req.get("origin");
  if (!origin || env.frontendOrigins.includes(origin)) return next();
  return res.status(403).json({ error: "Origen de solicitud no autorizado." });
};

const attachActorToBody = (req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    req.body = req.body || {};
    req.body.userId = req.user.id;
  }
  next();
};

module.exports = { securityHeaders, validateMutationOrigin, attachActorToBody };
