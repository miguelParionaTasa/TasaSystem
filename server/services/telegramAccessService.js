const prisma = require("../controllers/prisma");
const {
  hashTelegramId,
  encryptTelegramId,
} = require("../security/cryptoTelegram");

const getPlant = (plantCode = "PISCO_SUR") =>
  prisma.planta.findUnique({ where: { codigo: String(plantCode).trim().toUpperCase() } });

const registerPendingAccess = async (msg, plantCode = "PISCO_SUR") => {
  // El permiso pertenece a la cuenta, no al chat ni al dispositivo.
  const telegramId = String(msg.from?.id || msg.chat.id);
  const telegramIdHash = hashTelegramId(telegramId);
  const existing = await prisma.telegramAcceso.findUnique({
    where: { telegramIdHash },
    include: { user: true, planta: true },
  });
  const plant = await getPlant(plantCode);
  if (!plant?.activa) throw Object.assign(new Error("Código de planta no válido."), { code: "PLANT_NOT_FOUND" });
  if (existing) {
    if (!existing.activo && existing.plantaId !== plant.id) {
      return prisma.telegramAcceso.update({
        where: { id: existing.id },
        data: { plantaId: plant.id, nombreTelegram: [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(" ") || null, usernameTelegram: msg.from?.username || null },
        include: { user: true, planta: true },
      });
    }
    return existing;
  }

  return prisma.telegramAcceso.create({
    data: {
      plantaId: plant.id,
      telegramIdHash,
      telegramIdEncrypted: encryptTelegramId(telegramId),
      telegramIdUltimos4: telegramId.slice(-4),
      nombreTelegram: [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(" ") || null,
      usernameTelegram: msg.from?.username || null,
      activo: false,
    },
    include: { user: true, planta: true },
  });
};

const authorizeTelegram = async (telegramId) => {
  const access = await prisma.telegramAcceso.findUnique({
    where: { telegramIdHash: hashTelegramId(String(telegramId)) },
    include: {
      user: { include: { planta: true, area: true } },
      planta: true,
    },
  });

  if (!access?.activo || !access.user || access.user.isDeleted || !access.planta.activa) {
    return null;
  }

  await prisma.telegramAcceso.update({
    where: { id: access.id },
    data: { ultimoUso: new Date() },
  });
  return access;
};

module.exports = { registerPendingAccess, authorizeTelegram };
