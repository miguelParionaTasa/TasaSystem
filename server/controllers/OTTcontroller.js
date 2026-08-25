const prisma = require("./prisma");
// Crear una nueva OT
const createOTT = async (req, res) => {
  const { name, OTmaximo, estado, Temp, temporadaId } = req.body;

  try {
    // Verificar que los campos requeridos no sean nulos
    if (!name || !OTmaximo || !estado) {
      return res.status(400).json({ message: "Faltan campos requeridos." });
    }

    const temporada = temporadaId
      ? await prisma.temporada.findUnique({ where: { id: Number(temporadaId) } })
      : await prisma.temporada.findFirst({ where: { activa: true } });
    const codigoTemporada = temporada?.codigo || (Temp ? String(Temp).trim().toUpperCase().replaceAll(" ", "") : null);
    if (!codigoTemporada) return res.status(400).json({ message: "Selecciona o activa una temporada." });

    const ot = await prisma.oTbasico.create({
      data: {
        name,
        OTmaximo,
        estado,
        Temp: codigoTemporada,
        temporadaId: temporada?.id || null,
      },
    });

    res.status(201).json(ot);
  } catch (error) {
    console.error("Error al crear OT:", error);
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ message: `El nombre '${name}' ya está en uso.` });
    }
    res
      .status(500)
      .json({ message: "Error al crear OT", requestId: req.requestId });
  }
};

// Obtener todas las OTs
const getAllOTTs = async (req, res) => {
  try {
    const { zonaId, ubicacionId, temp } = req.query; // Obtener los parámetros de consulta

    // Construir el objeto de filtro
    const filters = {};
    if (zonaId) {
      filters.zonaId = parseInt(zonaId, 10); // Asegúrate de convertir a número
    }
    if (ubicacionId) {
      filters.ubicacionId = parseInt(ubicacionId, 10); // Asegúrate de convertir a número
    }
    if (temp) {
      filters.Temp = temp; // Filtrar por Temp
    }

    // Obtener las OTs con los filtros aplicados
    const ots = await prisma.oTbasico.findMany({
      where: filters, // Aplicar los filtros
      include: {
        Equipo: true, // Incluir información del equipo relacionado
        Ubicacion: true, // Incluir información de la ubicación relacionada
        Zona: true, // Incluir información de la zona relacionada
        Ots: true, // Incluir información de las OTs relacionadas
      },
    });

    res.status(200).json(ots);
  } catch (error) {
    console.error("Error al obtener OTs:", error);
    res.status(500).json({ message: "Error al obtener OTs", requestId: req.requestId });
  }
};

// Obtener una OT por ID
const getOTTById = async (req, res) => {
  const { id } = req.params;

  try {
    const ot = await prisma.oTbasico.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!ot) {
      return res.status(404).json({ message: "OT no encontrada." });
    }

    res.status(200).json(ot);
  } catch (error) {
    console.error("Error al obtener OT:", error);
    res
      .status(500)
      .json({ message: "Error al obtener OT", requestId: req.requestId });
  }
};

// Actualizar una OT
const updateOTT = async (req, res) => {
  const { id } = req.params;
  const { name, OTmaximo, estado } = req.body;

  try {
    const ot = await prisma.oTbasico.update({
      where: { id: parseInt(id, 10) },
      data: {
        name,
        OTmaximo,
        estado,
      },
    });

    res.status(200).json(ot);
  } catch (error) {
    console.error("Error al actualizar OT:", error);
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ message: `El nombre '${name}' ya está en uso.` });
    }
    res
      .status(500)
      .json({ message: "Error al actualizar OT", requestId: req.requestId });
  }
};

// Eliminar una OT
const deleteOTT = async (req, res) => {
  const { id } = req.params;

  try {
    const ot = await prisma.oTbasico.delete({
      where: { id: parseInt(id, 10) },
    });

    res.status(200).json({ message: "OT eliminada", ot });
  } catch (error) {
    console.error("Error al eliminar OT:", error);
    res
      .status(500)
      .json({ message: "Error al eliminar OT", requestId: req.requestId });
  }
};
const updateTecnicosOT = async (req, res) => {
  const { id } = req.params;
  const { tecnico1, tecnico2 } = req.body;

  try {
    const updated = await prisma.oTbasico.update({
      where: { id: parseInt(id) },
      data: { tecnico1, tecnico2 },
    });
    res.json(updated);
  } catch (error) {
    console.error("Error al actualizar técnicos:", error);
    res.status(500).json({ error: "No se pudo actualizar los técnicos." });
  }
};

module.exports = {
  createOTT,
  getAllOTTs,
  getOTTById,
  updateOTT,
  deleteOTT,
  updateTecnicosOT, 
};
