const roleIn = (user, roles) => Boolean(user && roles.includes(user.rol));

const requireRoles = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Sesión requerida." });
  if (!roleIn(req.user, roles)) {
    return res.status(403).json({ error: "No tienes permiso para esta acción." });
  }
  return next();
};

const enforceApiAuthorization = (req, res, next) => {
  const path = req.path.toLowerCase();
  const role = req.user.rol;
  const isRead = ["GET", "HEAD", "OPTIONS"].includes(req.method);
  const isAdmin = ["SUPER_ADMIN", "ADMIN_PLANTA"].includes(role);

  if (path.startsWith("/admin")) {
    return isAdmin ? next() : res.status(403).json({ error: "Módulo reservado para administración." });
  }
  if (path.startsWith("/auditoria")) {
    return ["SUPER_ADMIN", "ADMIN_PLANTA", "AUDITOR"].includes(role)
      ? next()
      : res.status(403).json({ error: "No tienes acceso a la auditoría." });
  }
  if (path.includes("/import") || path.startsWith("/export")) {
    return isAdmin ? next() : res.status(403).json({ error: "Importar o exportar requiere rol administrador." });
  }
  if (req.method === "DELETE") {
    return isAdmin ? next() : res.status(403).json({ error: "Eliminar requiere rol administrador." });
  }
  if (isRead) return next();
  if (["CONSULTA", "AUDITOR"].includes(role)) {
    return res.status(403).json({ error: "Tu rol es únicamente de consulta." });
  }
  return next();
};

module.exports = { requireRoles, enforceApiAuthorization, roleIn };
