const prisma = require("./prisma");
// Crear una nueva OT
const createOT = async (req, res) => {
  const {
    ottId,
    OT,
    equipoId,
    descripcionEquipo,
    zonaId,
    ubicacionId,
    userId,
    ubicacionSinId,
  } = req.body;

  try {
    // Validar que los campos requeridos no sean nulos
    if (!zonaId || !userId) {
      return res.status(400).json({ message: "Faltan campos requeridos." });
    }

    // Validar que userId, zonaId y equipoId sean números válidos
    if (isNaN(userId) || isNaN(zonaId) || (equipoId && isNaN(equipoId))) {
      return res.status(400).json({ message: "ID de usuario, zona o equipo no válidos." });
    }

    // Verificar si el OTmaximo existe en OTbasico
    if (ottId) {
      const otBasico = await prisma.oTbasico.findUnique({
        where: { OTmaximo: ottId },
      });

      if (!otBasico) {
        return res.status(400).json({ message: `OTmaximo '${ottId}' no existe en OTbasico.` });
      }
    }

    // Crear la nueva OT
    const ot = await prisma.ots.create({
      data: {
        OT: OT || null, // Si OT no se proporciona, se establece como null
        descripcionEquipo,
        ubicacionSinId,
        user: {
          connect: { id: parseInt(userId, 10) }, // Conectar el usuario existente
        },
        zona: {
          connect: { id: parseInt(zonaId, 10) }, // Conectar la zona existente
        },
        equipo: equipoId ? { connect: { id: parseInt(equipoId, 10) } } : undefined, // Conectar el equipo si se proporciona
        ubicacion: ubicacionId ? { connect: { id: parseInt(ubicacionId, 10) } } : undefined, // Conectar la ubicación si se proporciona
        // Conectar con OTbasico usando el campo OTmaximo
        OTbasico: ottId ? {
          connect: {
            plantaId_OTmaximo: { plantaId: req.plantaId, OTmaximo: String(ottId) },
          },
        } : undefined,
      },
    });

    // Respuesta exitosa
    res.status(201).json(ot);
  } catch (error) {
    console.error("Error al crear OT:", error);

    // Manejo de errores más detallado
    if (error.code === "P2002") {
      return res.status(409).json({ message: `El ottId '${ottId}' ya está en uso.` });
    }

    if (error.code === "P2025") {
      return res.status(404).json({ message: "No se encontró el registro relacionado." });
    }

    // Respuesta genérica para otros errores
    res.status(500).json({ message: "Error al crear OT", requestId: req.requestId });
  }
};
// Obtener todas las OTs


// Obtener una OT por ID
const getOTById = async (req, res) => {
  const { id } = req.params;

  try {
    const ot = await prisma.ots.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: true,
        equipo: true,
        ubicacion: true,
        zona: true,
      },
    });

    if (!ot) {
      return res.status(404).json({ message: "OT no encontrada" });
    }

    res.status(200).json(ot);
  } catch (error) {
    console.error("Error al obtener OT:", error);
    res.status(500).json({ message: "Error al obtener OT" });
  }
};

// Actualizar una OT
const updateOT = async (req, res) => {
  const { id } = req.params;
  const {
    ottId,
    OT,
    equipoId,
    descripcionEquipo,
    zonaId,
    ubicacionId,
    userId,
    ubicacionSinId,
  } = req.body;

  try {
    const ot = await prisma.ots.update({
      where: { id: parseInt(id) },
      data: {
        ottId,
        OT,
        equipoId: equipoId ? parseInt(equipoId, 10) : null,
        descripcionEquipo,
        zonaId: parseInt(zonaId, 10), // Asegúrate de que sea un número
        ubicacionId: ubicacionId ? parseInt(ubicacionId, 10) : null,
        userId: parseInt(userId, 10),
        ubicacionSinId,
      },
    });

    res.status(200).json(ot);
  } catch (error) {
    console.error("Error al actualizar OT:", error);
    res.status(500).json({ message: "Error al actualizar OT" });
  }
};

// Eliminar una OT
const deleteOT = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.ots.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send(); // No content
  } catch (error) {
    console.error("Error al eliminar OT:", error);
    res.status(500).json({ message: "Error al eliminar OT" });
  }
};
const getAllOTs = async (req, res) => {
  try {
    const ots = await prisma.ots.findMany({
      include: {
        OTbasico: true, // Incluir información de la OT básica relacionada
        user: true, // Incluir información del usuario
        equipo: true, // Incluir información del equipo
        ubicacion: true, // Incluir información de la ubicación
        zona: true, // Incluir información de la zona
        otConsumibles: true, // Incluir información de los consumibles relacionados
      },
    });
    res.status(200).json(ots);
  } catch (error) {
    console.error("Error al obtener OTs:", error);
    res.status(500).json({ message: "Error al obtener OTs" });
  }
};
const searchOts = async (req, res) => {
  const { startDate, endDate, zona, ubicacion, ottId, scope } = req.query;
  const userId = req.user.id;

  if (startDate && isNaN(new Date(startDate))) {
    return res.status(400).json({ error: "La fecha de inicio no es válida." });
  }
  if (endDate && isNaN(new Date(endDate))) {
    return res.status(400).json({ error: "La fecha de fin no es válida." });
  }
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    return res.status(400).json({ error: "La fecha de inicio debe ser anterior a la fecha de fin." });
  }
  if (zona && isNaN(Number(zona))) {
    return res.status(400).json({ error: "El ID de zona no es válido." });
  }
  if (ubicacion && isNaN(Number(ubicacion))) {
    return res.status(400).json({ error: "El ID de ubicación no es válido." });
  }
  if (ottId && typeof ottId !== 'string') {
    return res.status(400).json({ error: "El ottId debe ser un texto válido." });
  }

  // Construir condiciones de búsqueda
  const conditions = {};

  if (startDate) {
    conditions.otConsumibles = {
      some: {
        fechaCreacion: { gte: new Date(startDate) },
      },
    };
  }
  if (endDate) {
    conditions.otConsumibles = {
      ...conditions.otConsumibles,
      some: {
        ...conditions.otConsumibles?.some,
        fechaCreacion: { lte: new Date(endDate) },
      },
    };
  }
  if (zona) {
    conditions.zonaId = Number(zona);
  }
  if (ubicacion) {
    conditions.ubicacionId = Number(ubicacion);
  }
  if (ottId) {
    conditions.OTbasico = {
      is: {
        OTmaximo: ottId,
      },
    };
  }

  try {
    let ots;

    if (scope === "misMovimientos") {
      ots = await prisma.ots.findMany({
        where: {
          userId: Number(userId),
          ...conditions,
        },
        include: {
          OTbasico: true,
          user: true,
          equipo: true,
          ubicacion: true,
          zona: true,
          otConsumibles: {
            include: {
              consumible: true,
            },
          },
        },
      });
    } else if (scope === "miGrupo") {
      const user = await prisma.user.findUnique({
        where: { id: Number(userId) },
        select: { areaId: true },
      });

      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado." });
      }

      const groupUserIds = await prisma.user.findMany({
        where: { areaId: user.areaId },
        select: { id: true },
      });

      const ids = groupUserIds.map(u => u.id);

      ots = await prisma.ots.findMany({
        where: {
          userId: { in: ids },
          ...conditions,
        },
        include: {
          OTbasico: true,
          user: true,
          equipo: true,
          ubicacion: true,
          zona: true,
          otConsumibles: {
            include: {
              consumible: true,
            },
          },
        },
      });
    } else {
      return res.status(400).json({ error: "El valor de scope no es válido." });
    }

    if (ots.length === 0) {
      return res.status(404).json({ message: "No se encontraron órdenes de trabajo." });
    }

    res.status(200).json(ots);
  } catch (error) {
    console.error("Error al buscar órdenes de trabajo:", error);
    res.status(500).json({
      message: "Error al buscar órdenes de trabajo",
      requestId: req.requestId,
    });
  }
};

// Exportar las funciones del controlador
module.exports = {
  createOT,
  getAllOTs,
  getOTById,
  updateOT,
  deleteOT,
  searchOts,
};
