const prisma = require("./prisma");

const obtenerTelegramUsers = async (req, res) => {
  try {
    const users = await prisma.telegramUser.findMany({
      select: {
        id: true,
        telegramId: true,
        nombre: true,
        username: true,
        activo: true,
        fechaRegistro: true
      },
      orderBy: { fechaRegistro: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error("Error Prisma:", error);
    res.status(500).json({ message: "Error al obtener los usuarios de Telegram" });
  }
};

module.exports = { obtenerTelegramUsers };