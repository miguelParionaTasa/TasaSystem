const prisma = require("./prisma");
// Crear un nuevo OTConsumible
const createOTConsumible = async (req, res) => {
  const {
    consumibleId,
    nombreConsumible,
    unidadMedida,
    cantidad,
    otId,
    userId,
    imageUrl,
    estado,
    reservaSap,
    comentarios,
  } = req.body;

  // Definir el offset de Lima (UTC-5)
  const limaOffset = -5;
  const nowUtc = new Date();
  const limaDate = new Date(nowUtc.getTime() + limaOffset * 60 * 60 * 1000);

  try {
    let otConsumible;

    // Convertir cantidad a Float
    const cantidadFloat = parseFloat(cantidad);

    if (consumibleId) {
      // Si hay un consumibleId, se crea el OTConsumible asociado
      otConsumible = await prisma.oTConsumible.create({
        data: {
          consumibleId,
          otId,
          userId: parseInt(userId, 10), // Asegúrate de que userId sea un número
          imageUrl,
          estado,
          reservaSap,
          comentarios,
          cantidad: cantidadFloat, // Usar cantidad como Float
          fechaCreacion: limaDate, // Ajustar la fecha de creación
        },
      });
    } else {
      // Si no hay consumibleId, se crea un nuevo consumible y se asocia
      const nuevoConsumible = await prisma.consumible.create({
        data: {
          name: nombreConsumible,
          unidadMedida,
          codMaximo: "", // Puedes establecer un valor predeterminado o dejarlo vacío
          nombreMaximo: nombreConsumible, // O cualquier otro valor que desees
        },
      });

      // Luego, se crea el OTConsumible asociado al nuevo consumible
      otConsumible = await prisma.oTConsumible.create({
        data: {
          consumibleId: nuevoConsumible.id, // Asocia el nuevo consumible
          otId,
          userId: parseInt(userId, 10), // Asegúrate de que userId sea un número
          imageUrl,
          estado,
          reservaSap,
          comentarios,
          cantidad: cantidadFloat, // Usar cantidad como Float
          fechaCreacion: limaDate, // Ajustar la fecha de creación
        },
      });
    }

    res.status(201).json(otConsumible);
  } catch (error) {
    console.error("Error al crear OTConsumible:", error);

    // Manejo de errores más detallado
    if (error.code === "P2002") {
      return res.status(409).json({ message: "El consumible ya existe." });
    }

    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ message: "No se encontró el registro relacionado." });
    }

    res
      .status(500)
      .json({ message: "Error al crear OTConsumible", requestId: req.requestId });
  }
};

// Obtener todos los OTConsumibles
const getAllOTConsumibles = async (req, res) => {
  try {
    const otConsumibles = await prisma.oTConsumible.findMany({
      include: {
        consumible: true, // Incluir el consumible relacionado
        user: true, // Incluir el usuario relacionado
        ot: true, // Incluir la OT relacionada
      },
    });
    res.json(otConsumibles);
  } catch (error) {
    console.error("Error al obtener OTConsumibles:", error);
    res.status(500).json({ message: "Error al obtener OTConsumibles" });
  }
};

// Obtener un OTConsumible por ID
const getOTConsumibleById = async (req, res) => {
  const { id } = req.params;

  try {
    const otConsumible = await prisma.oTConsumible.findUnique({
      where: { id: parseInt(id) },
      include: {
        consumible: true, // Incluir el consumible relacionado
        user: true, // Incluir el usuario relacionado
        ot: true, // Incluir la OT relacionada
      },
    });

    if (!otConsumible) {
      return res.status(404).json({ message: "OTConsumible no encontrado" });
    }

    res.json(otConsumible);
  } catch (error) {
    console.error("Error al obtener OTConsumible:", error);
    res.status(500).json({ message: "Error al obtener OTConsumible" });
  }
};

// Actualizar un OTConsumible
const updateOTConsumible = async (req, res) => {
  const { id } = req.params;
  const {
    consumibleId,
    nombreConsumible,
    unidadMedida,
    cantidad,
    otId,
    userId,
    imageUrl,
    estado,
    reservaSap,
    comentarios,
  } = req.body;

  try {
    const otConsumible = await prisma.oTConsumible.update({
      where: { id: parseInt(id) },
      data: {
        consumibleId,
        otId,
        userId,
        imageUrl,
        estado,
        reservaSap,
        comentarios,
        cantidad,
      },
    });

    res.json(otConsumible);
  } catch (error) {
    console.error("Error al actualizar OTConsumible:", error);
    res.status(500).json({ message: "Error al actualizar OTConsumible" });
  }
};

// Eliminar un OTConsumible
const deleteOTConsumible = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.oTConsumible.delete({
      where: { id: parseInt(id) },
    });

    res.status(204).send(); // No content
  } catch (error) {
    console.error("Error al eliminar OTConsumible:", error);
    res.status(500).json({ message: "Error al eliminar OTConsumible" });
  }
};
const getConsumiblesByOTMaximo = async (req, res) => {
  const { otmaximo } = req.params;

  try {
    // Busca la OT que tenga ese OTmaximo
    const otBasica = await prisma.oTbasico.findUnique({
      where: { OTmaximo: otmaximo },
    });

    if (!otBasica) {
      return res.status(404).json({ message: 'OT no encontrada' });
    }

    // Busca los consumibles asociados a esa OT
    const consumibles = await prisma.oTConsumible.findMany({
      where: { ot: { OTbasico: { OTmaximo: otmaximo } } },
      include: {
        consumible: true,
        user: true,
      },
    });

    res.json(consumibles);
  } catch (error) {
    console.error('Error al obtener consumibles por OT:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Exportar las funciones
module.exports = {
  getConsumiblesByOTMaximo,
  createOTConsumible,
  getAllOTConsumibles,
  getOTConsumibleById,
  updateOTConsumible,
  deleteOTConsumible,
};
