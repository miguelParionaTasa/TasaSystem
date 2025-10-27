const prisma = require("./prisma");

// Obtener todas las áreas
const getAllAreas = async (req, res) => {
  try {
    const areas = await prisma.area.findMany({
      include: {
        users: true, // Incluir la relación con usuarios si es necesario
      },
    });

    res.status(200).json(areas);
  } catch (error) {
    console.error("Error al obtener áreas:", error);
    res.status(500).json({ message: "Error al obtener áreas" });
  }
};

// Obtener todas las zonas
const getAllZonas = async (req, res) => {
  try {
    const zonas = await prisma.zona.findMany({
      include: {
        equipos: true, // Incluir la relación con equipos si es necesario
        ots: true, // Incluir la relación con Ots si es necesario
      },
    });

    res.status(200).json(zonas);
  } catch (error) {
    console.error("Error al obtener zonas:", error);
    res.status(500).json({ message: "Error al obtener zonas" });
  }
};

// Obtener todas las ubicaciones
const getAllUbicaciones = async (req, res) => {
  try {
    const ubicaciones = await prisma.ubicacion.findMany({
      include: {
        zona: true,
        equipos: true, // Incluir la relación con equipos si es necesario
        ots: true, // Incluir la relación con Ots si es necesario
      },
    });

    res.status(200).json(ubicaciones);
  } catch (error) {
    console.error("Error al obtener ubicaciones:", error);
    res.status(500).json({ message: "Error al obtener ubicaciones" });
  }
};
const getUbicacionesPorZona = async (req, res) => {
  const { zonaId } = req.query; // Obtenemos el zonaId desde la query string

  if (!zonaId) {
    return res
      .status(400)
      .json({ message: "El parámetro zonaId es requerido" });
  }

  try {
    // Filtramos las ubicaciones que pertenecen a la zona y que tengan equipos asociados
    const ubicaciones = await prisma.ubicacion.findMany({
      where: {
        zonaId: parseInt(zonaId),
        equipos: {
          some: {}, // Solo ubicaciones con al menos un equipo
        },
      },
      include: {
        zona: true, // Incluir la relación con zona
        equipos: true, // Incluir la relación con equipos
        ots: true, // Incluir la relación con Ots si es necesario
      },
    });

    if (ubicaciones.length === 0) {
      return res
        .status(404)
        .json({
          message: "No se encontraron ubicaciones con equipos en esta zona",
        });
    }

    res.status(200).json(ubicaciones);
  } catch (error) {
    console.error("Error al obtener ubicaciones por zona:", error);
    res.status(500).json({ message: "Error al obtener ubicaciones por zona" });
  }
};

module.exports = {
  getAllAreas,
  getAllZonas,
  getAllUbicaciones,
  getUbicacionesPorZona,
};
