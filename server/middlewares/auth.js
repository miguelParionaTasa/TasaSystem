const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN_PLANTA"]);

module.exports = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Sesión requerida." });
  if (!ADMIN_ROLES.has(req.user.rol)) {
    return res.status(403).json({ error: "Acción reservada para administración." });
  }
  return next();
};
