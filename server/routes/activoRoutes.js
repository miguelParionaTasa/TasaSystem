const express = require("express");
const upload = require("../config/multer");
const prisma = require("../controllers/prisma");
const { uploadImage } = require("../config/cloudinary");
const {
  createActivo,
  getAllActivos,
  getActivoById,
  updateActivo,
  deleteActivo,
  getActivoHistorial,
  searchActivos,
  uploadActivoImage,
} = require("../controllers/activoController");

const authMiddleware = require("../middlewares/auth");
const router = express.Router();

// 🔹 Rutas CRUD básicas
router.get("/", getAllActivos);

// 🔹 Primero las rutas de búsqueda e historial (más específicas)
router.get("/search", searchActivos);
router.get("/:id/historial", getActivoHistorial);

// 🔹 Luego las rutas dinámicas
router.get("/:id", getActivoById);
router.put("/:id", updateActivo);
router.delete("/:id", deleteActivo);

// 🔹 Crear activo con o sin imagen
router.post("/", upload, createActivo);

// 🔹 Subir o actualizar imagen de un activo existente
router.post("/:id/upload-image", upload, async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No se subió ningún archivo" });
    }

    const result = await uploadImage(req.file.buffer, "activos");

    const image = await prisma.image.create({
      data: {
        url: result.secure_url,
        activos: { connect: { id: parseInt(id) } },
      },
      include: { activos: true },
    });

    res.status(201).json(image);
  } catch (error) {
    console.error("❌ Error al subir imagen:", error);
    res.status(500).json({ message: "Error al subir imagen", error });
  }
});

module.exports = router;
