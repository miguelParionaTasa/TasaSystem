const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createHash, timingSafeEqual } = require("node:crypto");
const prisma = require("./prisma");
const { env } = require("../config/env");
const { writeAudit } = require("../services/auditService");

const attempts = new Map();
const MAX_ATTEMPTS = 7;
const MAX_IP_ATTEMPTS = 50;
const WINDOW_MS = 15 * 60 * 1000;
const BCRYPT_PATTERN = /^\$2[aby]\$\d{2}\$/;
const DUMMY_HASH = bcrypt.hashSync("tasasystem-dummy-password", 12);

const publicUser = (user) => ({
  id: user.id,
  username: user.username,
  firstName: user.firstName,
  lastName: user.lastName,
  rol: user.rol,
  plantaId: user.plantaId,
  areaId: user.areaId,
  planta: user.planta,
  area: user.area,
});

const cookieOptions = () => ({
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: "lax",
  maxAge: env.sessionHours * 60 * 60 * 1000,
  path: "/",
});

const rateKey = (req, username) => `${req.ip}:${String(username).toLowerCase()}`;

const constantTimeLegacyCompare = (provided, stored) => timingSafeEqual(
  createHash("sha256").update(String(provided)).digest(),
  createHash("sha256").update(String(stored)).digest()
);

const isBlocked = (key, maximum = MAX_ATTEMPTS) => {
  const current = attempts.get(key);
  if (!current) return false;
  if (Date.now() - current.startedAt > WINDOW_MS) {
    attempts.delete(key);
    return false;
  }
  return current.count >= maximum;
};

const registerFailure = (key) => {
  if (attempts.size > 10000) {
    const cutoff = Date.now() - WINDOW_MS;
    for (const [attemptKey, value] of attempts) if (value.startedAt < cutoff) attempts.delete(attemptKey);
    if (attempts.size > 10000) attempts.clear();
  }
  const current = attempts.get(key);
  if (!current || Date.now() - current.startedAt > WINDOW_MS) {
    attempts.set(key, { count: 1, startedAt: Date.now() });
  } else {
    current.count += 1;
  }
};

const login = async (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");
  const key = rateKey(req, username);
  const ipKey = `ip:${req.ip}`;

  if (!username || !password || username.length > 100 || password.length > 1024) {
    return res.status(400).json({ error: "Usuario y contraseña son requeridos." });
  }
  if (isBlocked(key) || isBlocked(ipKey, MAX_IP_ATTEMPTS)) {
    return res.status(429).json({ error: "Demasiados intentos. Intenta nuevamente en 15 minutos." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        planta: { select: { id: true, codigo: true, nombre: true, activa: true } },
        area: { select: { id: true, name: true } },
      },
    });

    let valid = false;
    let legacyPassword = false;
    if (user && !user.isDeleted && user.planta.activa) {
      if (BCRYPT_PATTERN.test(user.password)) {
        valid = await bcrypt.compare(password, user.password);
      } else {
        // Mantiene un costo comparable a bcrypt mientras exista una clave heredada.
        await bcrypt.compare(password, DUMMY_HASH);
        valid = constantTimeLegacyCompare(password, user.password);
        legacyPassword = valid;
      }
    } else {
      await bcrypt.compare(password, DUMMY_HASH);
    }

    if (!valid) {
      registerFailure(key);
      registerFailure(ipKey);
      await writeAudit({
        origen: "WEB",
        accion: "LOGIN_FALLIDO",
        exitoso: false,
        estadoHttp: 401,
        ip: req.ip,
        userAgent: req.get("user-agent") || null,
        detalle: { username },
      });
      return res.status(401).json({ error: "Credenciales incorrectas." });
    }

    let tokenVersion = user.tokenVersion;
    if (legacyPassword) {
      const passwordHash = await bcrypt.hash(password, 12);
      const migrated = await prisma.user.update({
        where: { id: user.id },
        data: { password: passwordHash, passwordChangedAt: new Date() },
        select: { tokenVersion: true },
      });
      tokenVersion = migrated.tokenVersion;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { ultimoAcceso: new Date() },
    });

    const token = jwt.sign(
      { tv: tokenVersion },
      env.jwtSecret,
      {
        algorithm: "HS256",
        subject: String(user.id),
        issuer: "tasasystem-api",
        audience: "tasasystem-web",
        expiresIn: `${env.sessionHours}h`,
      }
    );

    attempts.delete(key);
    attempts.delete(ipKey);
    res.cookie(env.cookieName, token, cookieOptions());
    await writeAudit({
      usuarioId: user.id,
      plantaId: user.plantaId,
      rol: user.rol,
      origen: "WEB",
      accion: legacyPassword ? "LOGIN_Y_MIGRACION_PASSWORD" : "LOGIN_EXITOSO",
      exitoso: true,
      estadoHttp: 200,
      ip: req.ip,
      userAgent: req.get("user-agent") || null,
    });

    return res.json({ user: publicUser(user) });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
};

const logout = async (req, res) => {
  const { maxAge, ...clearOptions } = cookieOptions();
  res.clearCookie(env.cookieName, clearOptions);
  await writeAudit({
    usuarioId: req.user.id,
    plantaId: req.user.plantaId,
    rol: req.user.rol,
    origen: "WEB",
    accion: "LOGOUT",
    exitoso: true,
    estadoHttp: 204,
    ip: req.ip,
    userAgent: req.get("user-agent") || null,
  });
  return res.status(204).send();
};

const me = (req, res) => res.json({ user: publicUser(req.user) });

module.exports = { login, logout, me, publicUser };
