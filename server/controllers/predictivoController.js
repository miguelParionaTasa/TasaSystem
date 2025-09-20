const prisma = require("./prisma");
const cloudinary = require("../config/cloudinary");

// === Crear nuevo Predictivo con imágenes ===
const createPredictivo = async (req, res) => {
  try {
    const {
      zonaId,
      ubicacionId,
      equipoId,
      fecha,
      tecnica,
      recomendacionProveedor,
      recomendacionPredictivo,
      otGenerado,
      comentario,
      otRelacionada,
    } = req.body;

    // Subir imágenes si existen
    let imagesData = [];
    if (req.files?.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "predictivos",
        });
        imagesData.push({ url: result.secure_url });
      }
    }

    const predictivo = await prisma.predictivo.create({
      data: {
        zonaId: parseInt(zonaId),
        ubicacionId: parseInt(ubicacionId),
        equipoId: parseInt(equipoId),
        fecha: fecha ? new Date(fecha) : new Date(),
        tecnica,
        recomendacionProveedor,
        recomendacionPredictivo,
        otGenerado,
        comentario,
        otRelacionada,
        ...(imagesData.length > 0 && {
          images: { create: imagesData },
        }),
      },
      include: { zona: true, ubicacion: true, equipo: true, images: true },
    });

    res.status(201).json(predictivo);
  } catch (error) {
    console.error("❌ Error al crear Predictivo:", error);
    res.status(500).json({ message: "Error al crear Predictivo" });
  }
};

// === Obtener TODOS los predictivos ===
const getAllPredictivos = async (req, res) => {
  try {
    const predictivos = await prisma.predictivo.findMany({
      include: { zona: true, ubicacion: true, equipo: true, images: true },
      orderBy: { fecha: "desc" },
    });
    res.status(200).json(predictivos);
  } catch (error) {
    console.error("❌ Error al obtener Predictivos:", error);
    res.status(500).json({ message: "Error al obtener Predictivos" });
  }
};

// === Obtener por ID ===
const getPredictivoById = async (req, res) => {
  try {
    const { id } = req.params;
    const predictivo = await prisma.predictivo.findUnique({
      where: { id: parseInt(id) },
      include: {
        zona: true,
        ubicacion: true,
        equipo: true,
        images: true,
      },
    });

    if (!predictivo) {
      return res.status(404).json({ message: "Predictivo no encontrado" });
    }

    res.status(200).json(predictivo);
  } catch (error) {
    console.error("Error al obtener Predictivo:", error);
    res.status(500).json({ message: "Error al obtener Predictivo" });
  }
};


// === Actualizar predictivo ===
const updatePredictivo = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      zonaId,
      ubicacionId,
      equipoId,
      fecha,
      tecnica,
      recomendacionProveedor,
      recomendacionPredictivo,
      otGenerado,
      comentario,
      otRelacionada,
    } = req.body;

    let imagesData = [];
    if (req.files?.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "predictivos",
        });
        imagesData.push({ url: result.secure_url });
      }
    }

    const predictivo = await prisma.predictivo.update({
      where: { id: parseInt(id) },
      data: {
        ...(zonaId && { zonaId: parseInt(zonaId) }),
        ...(ubicacionId && { ubicacionId: parseInt(ubicacionId) }),
        ...(equipoId && { equipoId: parseInt(equipoId) }),
        ...(fecha && { fecha: new Date(fecha) }),
        ...(tecnica && { tecnica }),
        ...(recomendacionProveedor && { recomendacionProveedor }),
        ...(recomendacionPredictivo && { recomendacionPredictivo }),
        ...(otGenerado && { otGenerado }),
        ...(comentario && { comentario }),
        ...(otRelacionada && { otRelacionada }),
        ...(imagesData.length > 0 && { images: { create: imagesData } }),
      },
      include: { zona: true, ubicacion: true, equipo: true, images: true },
    });

    res.status(200).json(predictivo);
  } catch (error) {
    console.error("❌ Error al actualizar Predictivo:", error);
    res.status(500).json({ message: "Error al actualizar Predictivo" });
  }
};

// === Eliminar predictivo ===
const deletePredictivo = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.predictivo.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    console.error("❌ Error al eliminar Predictivo:", error);
    res.status(500).json({ message: "Error al eliminar Predictivo" });
  }
};

// === Buscar predictivos con filtros opcionales ===
// Buscar predictivos (con o sin filtros)
const searchPredictivos = async (req, res) => {
  try {
    const { zonaId, ubicacionId, equipoId } = req.query;

    const where = {};
    if (zonaId) where.zonaId = parseInt(zonaId);
    if (ubicacionId) where.ubicacionId = parseInt(ubicacionId);
    if (equipoId) where.equipoId = parseInt(equipoId);

    const predictivos = await prisma.predictivo.findMany({
      where,
      include: {
        zona: true,
        ubicacion: true,
        equipo: true,
        images: true,
      },
      orderBy: { fecha: "desc" },
    });

    res.status(200).json(predictivos);
  } catch (error) {
    console.error("Error al buscar Predictivos:", error);
    res.status(500).json({ message: "Error al buscar Predictivos" });
  }
};



module.exports = {
  createPredictivo,
  getAllPredictivos,
  getPredictivoById,
  updatePredictivo,
  deletePredictivo,
  searchPredictivos,
};
