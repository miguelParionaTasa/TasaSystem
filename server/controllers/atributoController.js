const prisma = require("./prisma");

// Crear un nuevo atributo
const createAtributo = async (req, res) => {
  const { equipoId, nombre, valor, userId } = req.body;

  try {
    const atributo = await prisma.atributo.create({
      data: {
        equipoId,
        nombre,
        valor,
        userId,
      },
    });
    res.status(201).json(atributo);
  } catch (error) {
    console.error("Error al crear atributo:", error);
    res.status(500).json({ message: "Error al crear atributo" });
  }
};

// Obtener todos los atributos
const getAllAtributos = async (req, res) => {
  try {
    const atributos = await prisma.atributo.findMany({
      include: {
        equipo: {
          include: {
            ubicacion: { include: { zona: true } },
          },
        },
        user: true,
      },
    });
    res.status(200).json(atributos);
  } catch (error) {
    console.error("Error al obtener atributos:", error);
    res.status(500).json({ message: "Error al obtener atributos" });
  }
};

// Obtener un atributo por ID
const getAtributoById = async (req, res) => {
  const { id } = req.params;
  console.log("👉 ID recibido:", id);  // 👈 Verifica qué llega

  try {
    if (!id) {
      return res.status(400).json({ message: "Debe enviar un ID válido en la URL" });
    }

    const atributo = await prisma.atributo.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        equipo: {
          include: {
            ubicacion: { include: { zona: true } },
          },
        },
        user: true,
      },
    });

    if (!atributo) {
      return res.status(404).json({ message: "Atributo no encontrado" });
    }

    res.status(200).json(atributo);
  } catch (error) {
    console.error("Error al obtener atributo por ID:", error);
    res.status(500).json({ message: "Error al obtener atributo" });
  }
};



// Actualizar un atributo con historial
// Después:
const updateAtributo = async (req, res) => {
  const { id } = req.params;
  const { nombre, valor, userId } = req.body;

  try {
    const atributoActual = await prisma.atributo.findUnique({
      where: { id: parseInt(id) },
    });

    if (!atributoActual) {
      return res.status(404).json({ message: "Atributo no encontrado" });
    }

    // Guardar historial
    await prisma.atributoHistorial.create({
      data: {
        atributoId: atributoActual.id,
        valorAnterior: atributoActual.valor,
        valorNuevo: valor,
        userId,
      },
    });

    const updatedAtributo = await prisma.atributo.update({
      where: { id: parseInt(id) },
      data: { nombre, valor, userId },
    });

    res.status(200).json(updatedAtributo);
  } catch (error) {
    console.error("Error al actualizar atributo:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Atributo no encontrado" });
    } else if (error.code === "P2002") {
      return res.status(400).json({ message: "Datos inválidos" });
    } else {
      return res.status(500).json({ message: "Error al actualizar atributo" });
    }
  }
};

// Eliminar un atributo
const deleteAtributo = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.atributo.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    console.error("Error al eliminar atributo:", error);
    res.status(500).json({ message: "Error al eliminar atributo" });
  }
};

// Historial de un atributo
const getAtributoHistorial = async (req, res) => {
  const { id } = req.params;

  try {
    const historial = await prisma.atributoHistorial.findMany({
      where: { atributoId: parseInt(id) },
      include: { user: true },
      orderBy: { fechaCambio: "desc" },
    });

    if (historial.length === 0) {
      return res.status(404).json({ message: "No se encontró historial para este atributo." });
    }

    res.status(200).json(historial);
  } catch (error) {
    console.error("Error al obtener el historial del atributo:", error);
    res.status(500).json({ message: "Error al obtener el historial del atributo." });
  }
};

// 🔎 Buscar por zona, ubicación, equipo o nombre de atributo
const searchAtributos = async (req, res) => {
  const { zonaId, ubicacionId, equipoId, nombre } = req.query;

  try {
    const atributos = await prisma.atributo.findMany({
      where: {
        AND: [
          zonaId ? { equipo: { zonaId: parseInt(zonaId) } } : {},
          ubicacionId ? { equipo: { ubicacionId: parseInt(ubicacionId) } } : {},
          equipoId ? { equipoId: parseInt(equipoId) } : {},
          nombre ? { nombre: { contains: nombre, mode: "insensitive" } } : {},
        ],
      },
      include: {
        equipo: {
          include: {
            ubicacion: { include: { zona: true } },
          },
        },
        user: true,
      },
    });

    res.status(200).json(atributos);
  } catch (error) {
    console.error("Error en la búsqueda de atributos:", error);
    res.status(500).json({ message: "Error en la búsqueda de atributos" });
  }
};


module.exports = {
  createAtributo,
  getAllAtributos,
  getAtributoById,
  updateAtributo,
  deleteAtributo,
  getAtributoHistorial,
  searchAtributos,
};
