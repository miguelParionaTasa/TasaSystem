const prisma = require("./prisma");
const cloudinary = require("../config/cloudinary");

// ====================
// Obtener ubicaciones únicas filtradas por zona
// ====================
const getUbicacionesByZona = async (req, res) => {
  try {
    const zona = String(req.query.zona || "").trim();
    if (!zona) {
      return res.status(400).json({ message: "Zona requerida" });
    }

const ubicaciones = await prisma.ubicacion.findMany({
  where: {
    lubricaciones: {
      some: { zona: String(zona) } // aseguramos string
    }
  },
  select: { id: true, name: true },
  distinct: ["id"]
});

    res.json(ubicaciones);
  } catch (error) {
    console.error("Error al obtener ubicaciones:", error);
    res.status(500).json({
      message: process.env.NODE_ENV === "development" ? error.message : "Error interno"
    });
  }
};

// ====================
// Obtener lubricantes únicos filtrados por zona
// ====================
const getLubricantesByZona = async (req, res) => {
  try {
    const zona = String(req.query.zona || "").trim();
    if (!zona) {
      return res.status(400).json({ message: "Zona requerida" });
    }

    const lubricantes = await prisma.lubricacion.findMany({
      where: { zona },
      distinct: ["lubricante"],
      select: { lubricante: true }
    });

    res.json(lubricantes);
  } catch (error) {
    console.error("Error al obtener lubricantes:", error);
    res.status(500).json({
      message: process.env.NODE_ENV === "development" ? error.message : "Error interno"
    });
  }
};

// ====================
// Obtener lista filtrada
// ====================
const getLubricaciones = async (req, res) => {
  try {
    const { zona, ubicacionId, lubricante } = req.query;

    const filtros = {};
    if (zona) filtros.zona = String(zona).trim();
    if (ubicacionId) filtros.ubicacionId = parseInt(ubicacionId);
    if (lubricante) filtros.lubricante = String(lubricante).trim();

    const datos = await prisma.lubricacion.findMany({
      where: filtros,
      include: { ubicacion: true, images: true },
      orderBy: { id: "asc" }
    });

    res.json(datos);
  } catch (error) {
    console.error("Error al obtener lubricaciones:", error);
    res.status(500).json({
      message: process.env.NODE_ENV === "development" ? error.message : "Error interno"
    });
  }
};

// ====================
// Eliminar lubricación
// ====================
const deleteLubricacion = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    await prisma.lubricacion.delete({ where: { id } });
    res.json({ message: "Registro eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar lubricación:", error);
    res.status(500).json({
      message: process.env.NODE_ENV === "development" ? error.message : "Error interno"
    });
  }
};

// ====================
// Subir imagen
// ====================
const uploadImagen = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No se ha enviado una imagen" });
    }

    // Convertir buffer a base64 para subir a Cloudinary
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    const resultado = await cloudinary.uploader.upload(base64Image, {
      folder: "lubricaciones"
    });

    await prisma.image.create({
      data: {
        url: resultado.secure_url,
        lubricacion: { connect: { id } }
      }
    });

    res.json({ message: "Imagen subida correctamente" });
  } catch (error) {
    console.error("Error al subir imagen:", error);
    res.status(500).json({
      message: process.env.NODE_ENV === "development" ? error.message : "Error interno"
    });
  }
};

module.exports = {
  getUbicacionesByZona,
  getLubricantesByZona,
  getLubricaciones,
  deleteLubricacion,
  uploadImagen
};
