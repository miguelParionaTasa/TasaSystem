const prisma = require("./prisma");

// Crear un nuevo consumible
const createConsumible = async (req, res) => {
  const { name, unidadMedida, codMaximo, nombreMaximo } = req.body;

  try {
    const consumible = await prisma.consumible.create({
      data: {
        name,
        unidadMedida,
        codMaximo,
        nombreMaximo,
      },
    });
    res.status(201).json(consumible);
  } catch (error) {
    console.error("Error al crear consumible:", error);
    res.status(500).json({ message: "Error al crear consumible" });
  }
};

// Obtener todos los consumibles
const getAllConsumibles = async (req, res) => {
  try {
    const consumibles = await prisma.consumible.findMany();
    res.status(200).json(consumibles);
  } catch (error) {
    console.error("Error al obtener consumibles:", error);
    res.status(500).json({ message: "Error al obtener consumibles" });
  }
};

// Obtener un consumible por ID
const getConsumibleById = async (req, res) => {
  const { id } = req.params;

  try {
    const consumible = await prisma.consumible.findUnique({
      where: { id: parseInt(id) },
    });

    if (!consumible) {
      return res.status(404).json({ message: "Consumible no encontrado" });
    }

    res.status(200).json(consumible);
  } catch (error) {
    console.error("Error al obtener consumible:", error);
    res.status(500).json({ message: "Error al obtener consumible" });
  }
};

// Actualizar un consumible
const updateConsumible = async (req, res) => {
  const { id } = req.params;
  const { name, unidadMedida, codMaximo, nombreMaximo } = req.body;

  try {
    const consumible = await prisma.consumible.update({
      where: { id: parseInt(id) },
      data: {
        name,
        unidadMedida,
        codMaximo,
        nombreMaximo,
      },
    });

    res.status(200).json(consumible);
  } catch (error) {
    console.error("Error al actualizar consumible:", error);
    res.status(500).json({ message: "Error al actualizar consumible" });
  }
};

// Eliminar un consumible (solo si el usuario es admin)
const deleteConsumible = async (req, res) => {
  const { id } = req.params;
  const user = req.user; // Asumiendo que el usuario está en req.user después de la autenticación

  if (!user || user.rol !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "No tienes permiso para eliminar consumibles" });
  }

  try {
    await prisma.consumible.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send(); // No content
  } catch (error) {
    console.error("Error al eliminar consumible:", error);
    res.status(500).json({ message: "Error al eliminar consumible" });
  }
};
const searchConsumibles = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const page = Math.max(parseInt(req.query.page ?? "1", 10), 1);
    const take = Math.min(Math.max(parseInt(req.query.take ?? "50", 10), 1), 500);

    const skip = (page - 1) * take;

    if (!q) {
      return res.json({ data: [], total: 0, page, pages: 0 });
    }

    // Soportar búsquedas con varias palabras: "perno inox 3/8"
    const terms = q.split(/\s+/).filter(Boolean);

    const where = {
      AND: terms.map((t) => ({
        name: { contains: t, mode: "insensitive" },
      })),
    };

    const [data, total] = await prisma.$transaction([
      prisma.consumible.findMany({
        where,
        skip,
        take,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          unidadMedida: true,
          codMaximo: true,
          nombreMaximo: true,
        },
      }),
      prisma.consumible.count({ where }),
    ]);

    return res.json({
      data,
      total,
      page,
      pages: Math.ceil(total / take),
    });
  } catch (error) {
    console.error("Error en búsqueda de consumibles:", error);
    res.status(500).json({ message: "Error en búsqueda de consumibles" });
  }
};



module.exports = {
  searchConsumibles,
  createConsumible,
  getAllConsumibles,
  getConsumibleById,
  updateConsumible,
  deleteConsumible,
};
