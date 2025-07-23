const prisma = require("./prisma");

// Obtener todos los históricos con datos de ubicación y zona
const getAllHistoricos = async (req, res) => {
  try {
    const ubicaciones = await prisma.ubicacion.findMany({
      include: {
        zona: true,
        historico: {
          orderBy: {
            fecha: 'desc',
          },
          take: 1,
        },
      },
    });

    const formateado = ubicaciones.map((ubi) => ({
      id: ubi.id,
      nombre: ubi.nombre,
      name: ubi.name,
      zonaId: ubi.zonaId,
      zonaNombre: ubi.zona?.nombreMaximo,
      historico: ubi.historico[0] || null,
    }));

    res.json(formateado);
  } catch (error) {
    console.error("Error al obtener históricos:", error);
    res.status(500).json({ error: "Error al obtener históricos" });
  }
};

// Obtener históricos filtrados por zona y/o ubicación
const getHistoricosPorZona = async (req, res) => {
  const { zonaId, ubicacionId } = req.query;

  try {
    const where = {};

    if (zonaId) {
      where.zonaId = parseInt(zonaId);
    }

    if (ubicacionId) {
      where.ubicacionId = parseInt(ubicacionId);
    }

    const historicos = await prisma.historico.findMany({
      where,
      orderBy: {
        fecha: 'desc',
      },
      include: {
        zona: true,
        ubicacion: true,
        consumible: true,
      },
    });

    const formateado = historicos.map((h) => ({
  id: h.id,
  fecha: h.fecha,
  cantidad: h.cantidad,
  trabajo: h.trabajo,
  ot: h.ot,
  zona: h.zona?.nombreMaximo,
  ubicacion: h.ubicacion?.name,
 consumible:
  h.consumible?.nombreMaximo ||
  (h.consumible?.name ? h.consumible.name.slice(0, 34) : "Desconocido"),

  unidadMedida: h.consumible?.unidadMedida || "N/A",
}));


    res.json(formateado);
  } catch (error) {
    console.error("Error al filtrar históricos:", error);
    res.status(500).json({ error: "Error al filtrar históricos" });
  }
};


module.exports = {
  getAllHistoricos,
  getHistoricosPorZona,
};
