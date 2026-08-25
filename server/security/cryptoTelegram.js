const crypto = require("node:crypto");
const { env } = require("../config/env");

const deriveKey = (purpose) =>
  crypto.createHmac("sha256", env.telegramDataKey).update(`tasasystem:${purpose}:v1`).digest();

const hashTelegramId = (telegramId) =>
  crypto
    .createHmac("sha256", deriveKey("lookup"))
    .update(String(telegramId))
    .digest("hex");

const encryptTelegramId = (telegramId) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", deriveKey("encryption"), iv);
  const encrypted = Buffer.concat([
    cipher.update(String(telegramId), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
};

const decryptTelegramId = (payload) => {
  const [ivValue, tagValue, encryptedValue] = String(payload).split(".");
  if (!ivValue || !tagValue || !encryptedValue) {
    throw new Error("Identificador de Telegram cifrado inválido");
  }
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    deriveKey("encryption"),
    Buffer.from(ivValue, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
};

module.exports = { hashTelegramId, encryptTelegramId, decryptTelegramId };
