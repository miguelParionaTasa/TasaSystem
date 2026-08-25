const prisma = require("./prisma");
// Crear un nuevo equipo
const createEquipo = async (req, res) => {
  const { name, nombreMaximo, zonaId, ubicacionId, ubicacionSinId, imageUrl } = req.body;

  try {
    const equipo = await prisma.equipo.create({
      data: {
        name,
        nombreMaximo,
        zonaId,
        ubicacionId,
        ubicacionSinId, // Incluir el nuevo atributo
        imageUrl,
      },
    });
    res.status(201).json(equipo);
  } catch (error) {
    console.error("Error al crear equipo:", error);
    res.status(500).json({ message: "Error al crear equipo" });
  }
};

// Obtener todos los equipos
const getAllEquipos = async (req, res) => {
  try {
    const equipos = await prisma.equipo.findMany({
      include: {
        zona: true, // Incluir la zona relacionada
        ubicacion: true, // Incluir la ubicación relacionada
      },
    });
    res.status(200).json(equipos);
  } catch (error) {
    console.error("Error al obtener equipos:", error);
    res.status(500).json({ message: "Error al obtener equipos" });
  }
};

// Obtener un equipo por ID
const getEquipoById = async (req, res) => {
  const { id } = req.params;

  try {
    const equipo = await prisma.equipo.findUnique({
      where: { id: parseInt(id) },
      include: {
        zona: true,
        ubicacion: true,
      },
    });

    if (!equipo) {
      return res.status(404).json({ message: "Equipo no encontrado" });
    }

    res.status(200).json(equipo);
  } catch (error) {
    console.error("Error al obtener equipo:", error);
    res.status(500).json({ message: "Error al obtener equipo" });
  }
};

// Actualizar un equipo
const updateEquipo = async (req, res) => {
  const { id } = req.params;
  const { name, nombreMaximo, zonaId, ubicacionId, ubicacionSinId, imageUrl } = req.body;

  try {
    const equipo = await prisma.equipo.update({
      where: { id: parseInt(id) },
      data: {
        name,
        nombreMaximo,
        zonaId,
        ubicacionSinId, // Incluir el nuevo atributo
        ubicacionId,
        imageUrl,
      },
    });

    res.status(200).json(equipo);
  } catch (error) {
    console.error("Error al actualizar equipo:", error);
    res.status(500).json({ message: "Error al actualizar equipo" });
  }
};

// Eliminar un equipo (solo si el usuario es admin)
const deleteEquipo = async (req, res) => {
  const { id } = req.params;
  const user = req.user; // Asumiendo que el usuario está en req.user después de la autenticación

  if (!user || !["SUPER_ADMIN", "ADMIN_PLANTA"].includes(user.rol)) {
    return res
      .status(403)
      .json({ message: "No tienes permiso para eliminar equipos" });
  }

  try {
    await prisma.equipo.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send(); // No content
  } catch (error) {
    console.error("Error al eliminar equipo:", error);
    res.status(500).json({ message: "Error al eliminar equipo" });
  }
};

const getEquiposByZonaId = async (req, res) => {
  const { zonaId } = req.params;
  const { ubicacionId } = req.query; // Obtener ubicacionId de los parámetros de consulta

  try {
    const equipos = await prisma.equipo.findMany({
      where: {
        zonaId: parseInt(zonaId), // Filtrar por zonaId
        ...(ubicacionId && { ubicacionId: parseInt(ubicacionId) }), // Filtrar por ubicacionId si se proporciona
      },
      include: {
        zona: true, // Incluir la zona relacionada
        ubicacion: true, // Incluir la ubicación relacionada
      },
    });
    res.status(200).json(equipos);
  } catch (error) {
    console.error("Error al obtener equipos por zona y ubicación:", error);
    res
      .status(500)
      .json({ message: "Error al obtener equipos por zona y ubicación" });
  }
};

module.exports = {
  createEquipo,
  getEquiposByZonaId,
  getAllEquipos,
  getEquipoById,
  updateEquipo,
  deleteEquipo,
};
