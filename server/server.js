const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { randomUUID } = require("node:crypto");

const { env, validateEnvironment } = require("./config/env");
const prisma = require("./controllers/prisma");
const iniciarTelegramBot = require("./services/telegramBot");
const authenticateJWT = require("./middlewares/authenticateJWT");
const { tenantContextMiddleware } = require("./security/tenantContext");
const { enforceApiAuthorization, requireRoles } = require("./middlewares/authorization");
const { attachActorToBody, validateMutationOrigin } = require("./middlewares/security");
const auditHttp = require("./middlewares/auditHttp");
const validateScopedUploadParent = require("./middlewares/scopedParent");
const { validatePlantReferences } = require("./middlewares/plantReferences");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const auditRoutes = require("./routes/auditRoutes");
const userRoutes = require("./routes/routes");
const variosRoutes = require("./routes/variosroutes");
const otBotRoutes = require("./routes/otBotRoutes");
const consumibleRoutes = require("./routes/consumibleRoutes");
const exportRoutes = require("./routes/export");
const otMovimientoSapRoutes = require("./routes/otMovimientoSapRoutes");
const equipoRoutes = require("./routes/equipoRoutes");
const componenteRoutes = require("./routes/componenteRoutes");
const atributoRoutes = require("./routes/atributoRoutes");
const procesoRoutes = require("./routes/procesoRoutes");
const otsRoutes = require("./routes/otsRoutes");
const lubricacionRoutes = require("./routes/lubricacionRoutes");
const ottRoutes = require("./routes/OTTRoute");
const historicoRoutes = require("./routes/historicoRoutes");
const otConsumibleRoutes = require("./routes/otConsumibleRoutes");
const inventarioRoutes = require("./routes/inventarioRoutes");
const predictivoRoutes = require("./routes/predictivoRoutes");
const activoRoutes = require("./routes/activoRoutes");
const clinicaRoutes = require("./routes/clinicaRoutes");
const otConsumiblesRoutes = require("./routes/otConsumiblesRoutes");
const tarjetaRojaRoutes = require("./routes/tarjetaRojaRoutes");
const solicitudMaterialRoutes = require("./routes/solicitudMaterialRoutes");
const importacionActivoRoutes = require("./routes/importacionActivoRoutes");

validateEnvironment();

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
const hiddenJsonFields = new Set([
  "password", "tokenVersion", "telegramIdHash", "telegramIdEncrypted",
  "JWT_SECRET", "TELEGRAM_BOT_TOKEN", "CLOUDINARY_API_SECRET",
]);
app.set("json replacer", (key, value) => {
  if (hiddenJsonFields.has(key)) return undefined;
  return typeof value === "bigint" ? value.toString() : value;
});

app.use((req, res, next) => {
  req.requestId = req.get("X-Request-Id") || randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  if (env.nodeEnv === "production") res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

app.use(cors({
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Planta-Id", "X-Request-Id"],
  origin(origin, callback) {
    if (!origin || env.frontendOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origen no permitido por CORS."));
  },
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

app.get("/ping", async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ ok: true });
  } catch (error) {
    next(error);
  }
});
app.use("/auth", authRoutes);
// Compatibilidad temporal con el frontend anterior. Devuelve cookie, nunca el JWT.
app.post("/login", validateMutationOrigin, require("./controllers/authController").login);

app.use(authenticateJWT);
app.use(tenantContextMiddleware);
app.use(validateMutationOrigin);
app.use(attachActorToBody);
app.use(enforceApiAuthorization);
app.use(validatePlantReferences);
app.use(validateScopedUploadParent);
app.use(auditHttp);

app.get("/plantas", async (req, res, next) => {
  try {
    const roles = ["SUPER_ADMIN", "ADMIN_PLANTA", "SUPERVISOR"];
    if (!roles.includes(req.user.rol)) return res.json([req.user.planta]);
    return res.json(await prisma.planta.findMany({ where: { activa: true }, orderBy: { nombre: "asc" } }));
  } catch (error) {
    return next(error);
  }
});

app.use("/admin", adminRoutes);
app.use("/auditoria", auditRoutes);
app.use("/solicitudes-material", solicitudMaterialRoutes);
app.use("/importaciones/activos", importacionActivoRoutes);
app.use("/useres", userRoutes);
app.use("/tarjeta-roja", tarjetaRojaRoutes);
app.use("/consumibles", consumibleRoutes);
app.use("/varios", variosRoutes);
app.use("/equipos", equipoRoutes);
app.use("/componentes", componenteRoutes);
app.use("/atributos", atributoRoutes);
app.use("/procesos", procesoRoutes);
app.use("/ots", otsRoutes);
app.use("/ott", ottRoutes);
app.use("/inventario", inventarioRoutes);
app.use("/otc", otConsumibleRoutes);
app.use("/lubricacion", lubricacionRoutes);
app.use("/historico", historicoRoutes);
app.use("/export", exportRoutes);
app.use("/predictivos", predictivoRoutes);
app.use("/activos", activoRoutes);
app.use("/clinicas", clinicaRoutes);
app.use("/sap-movimientos", otMovimientoSapRoutes);
app.use("/otbot", otBotRoutes);
app.use("/ot-consumibles", otConsumiblesRoutes);

app.get("/configuracion", async (req, res, next) => {
  try {
    const config = await prisma.configuracion.findFirst();
    res.json(config || { plantaId: req.plantaId, fechaCorte: null });
  } catch (error) {
    next(error);
  }
});

app.patch("/configuracion", requireRoles("SUPER_ADMIN", "ADMIN_PLANTA"), async (req, res, next) => {
  try {
    const fechaCorte = req.body.fechaCorte == null ? null : String(req.body.fechaCorte);
    const existing = await prisma.configuracion.findFirst();
    const config = existing
      ? await prisma.configuracion.update({ where: { id: existing.id }, data: { fechaCorte } })
      : await prisma.configuracion.create({ data: { fechaCorte } });
    res.json(config);
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => res.status(404).json({ error: "Ruta no encontrada." }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const isUploadError = error instanceof multer.MulterError || error.code === "INVALID_FILE_TYPE";
  const status = isUploadError ? 400 : error.status || 500;
  if (status >= 500) console.error(`[${req.requestId || "sin-id"}]`, error);
  return res.status(status).json({
    error: isUploadError ? error.message : status >= 500 ? "Error interno del servidor." : error.message,
    requestId: req.requestId,
  });
});

let server;
let telegramBot;
const shutdown = async () => {
  if (telegramBot?.stop) await telegramBot.stop();
  if (server) await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
};

if (require.main === module) {
  server = app.listen(env.port, () => {
    console.log(`Servidor escuchando en el puerto ${env.port}`);
    if (env.telegramToken) telegramBot = iniciarTelegramBot();
  });
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, () => shutdown().finally(() => process.exit(0)));
  }
}

module.exports = { app, shutdown };
