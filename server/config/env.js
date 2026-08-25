require("dotenv").config();

const splitCsv = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3001),
  jwtSecret: process.env.JWT_SECRET || "",
  sessionHours: Number(process.env.SESSION_HOURS || 8),
  cookieName: process.env.AUTH_COOKIE_NAME || "tasasystem_session",
  frontendOrigins: splitCsv(
    process.env.FRONTEND_URLS ||
      "http://localhost:3000,https://tasasystem.netlify.app"
  ),
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || "",
  telegramDataKey: process.env.TELEGRAM_DATA_KEY || "",
};

const validateEnvironment = () => {
  const errors = [];

  if (!process.env.DATABASE_URL) {
    errors.push("DATABASE_URL es obligatoria");
  }

  if (env.jwtSecret.length < 32) {
    errors.push("JWT_SECRET debe tener al menos 32 caracteres aleatorios");
  }

  if (env.telegramToken && env.telegramDataKey.length < 32) {
    errors.push(
      "TELEGRAM_DATA_KEY debe tener al menos 32 caracteres cuando Telegram está activo"
    );
  }

  if (errors.length) {
    const error = new Error(`Configuración insegura:\n- ${errors.join("\n- ")}`);
    error.code = "ENV_INVALID";
    throw error;
  }
};

module.exports = { env, validateEnvironment };
