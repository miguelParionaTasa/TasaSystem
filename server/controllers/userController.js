const prisma = require("./prisma");

const listUsers = async (req, res) => {
  const users = await prisma.user.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      rol: true,
      area: { select: { id: true, name: true } },
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });
  return res.json(users);
};

const getUser = async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId)) return res.status(400).json({ error: "ID inválido." });

  const canReadOthers = ["SUPER_ADMIN", "ADMIN_PLANTA", "SUPERVISOR", "AUDITOR"].includes(req.user.rol);
  if (userId !== req.user.id && !canReadOthers) {
    return res.status(403).json({ error: "No puedes consultar otro usuario." });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      rol: true,
      plantaId: true,
      areaId: true,
      isDeleted: true,
      area: { select: { id: true, name: true } },
      planta: { select: { id: true, codigo: true, nombre: true } },
    },
  });
  if (!user) return res.status(404).json({ error: "Usuario no encontrado." });
  return res.json(user);
};

module.exports = { listUsers, getUser };
