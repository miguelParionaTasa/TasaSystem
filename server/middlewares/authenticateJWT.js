const jwt = require("jsonwebtoken");
const prisma = require("../controllers/prisma");
const { env } = require("../config/env");

const parseCookies = (header = "") =>
  header.split(";").reduce((cookies, part) => {
    const separator = part.indexOf("=");
    if (separator === -1) return cookies;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {});

const readToken = (req) => {
  const cookies = parseCookies(req.headers.cookie || "");
  if (cookies[env.cookieName]) return cookies[env.cookieName];
  const authorization = req.get("Authorization") || "";
  return authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : null;
};

const authenticateJWT = async (req, res, next) => {
  const token = readToken(req);
  if (!token) return res.status(401).json({ error: "Sesión requerida." });

  try {
    const decoded = jwt.verify(token, env.jwtSecret, {
      algorithms: ["HS256"],
      issuer: "tasasystem-api",
      audience: "tasasystem-web",
    });
    const user = await prisma.user.findUnique({
      where: { id: Number(decoded.sub) },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        rol: true,
        plantaId: true,
        areaId: true,
        tokenVersion: true,
        isDeleted: true,
        planta: { select: { id: true, codigo: true, nombre: true, activa: true } },
        area: { select: { id: true, name: true } },
      },
    });

    if (!user || user.isDeleted || !user.planta.activa || user.tokenVersion !== Number(decoded.tv)) {
      return res.status(401).json({ error: "La sesión ya no es válida." });
    }
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: "Sesión inválida o expirada." });
  }
};

module.exports = authenticateJWT;
