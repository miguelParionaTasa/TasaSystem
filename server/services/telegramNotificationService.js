const axios = require("axios");
const { env } = require("../config/env");
const { decryptTelegramId } = require("../security/cryptoTelegram");

const notifyRequestStatus = async (request) => {
  if (!env.telegramToken || !request.telegramAcceso?.telegramIdEncrypted) return false;
  try {
    const chatId = decryptTelegramId(request.telegramAcceso.telegramIdEncrypted);
    await axios.post(
      `https://api.telegram.org/bot${env.telegramToken}/sendMessage`,
      {
        chat_id: chatId,
        text: `Actualización de pedido ${request.codigo}\nOT: ${request.otNumero}\nEstado: ${request.estado}${request.observacion ? `\nObservación: ${request.observacion}` : ""}`,
      },
      { timeout: 10000, maxBodyLength: 128 * 1024, maxContentLength: 512 * 1024, proxy: false }
    );
    return true;
  } catch (error) {
    console.error("No se pudo notificar el estado por Telegram:", error.message);
    return false;
  }
};

module.exports = { notifyRequestStatus };
