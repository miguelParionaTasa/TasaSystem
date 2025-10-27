const express = require("express");
const upload = require("../config/multer"); // tu configuración Multer
const prisma = require("../controllers/prisma");
const { uploadImage } = require("../config/cloudinary");
const {
  createproceso,
  getAllprocesos,
  getprocesoById,
  updateproceso,
  deleteproceso,
  getprocesoHistorial,
  searchprocesos,
  uploadprocesoImage,
} = require("../controllers/procesoController");

const authMiddleware = require("../middlewares/auth");

const router = express.Router();

// 🔹 Rutas CRUD básicas
router.get("/", getAllprocesos);

// 🔹 Rutas de búsqueda y historial
router.get("/search", searchprocesos);
router.get("/:id/historial", getprocesoHistorial);

// 🔹 Rutas con parámetro después
router.get("/:id", getprocesoById);
router.put("/:id", updateproceso);
router.delete("/:id", deleteproceso);

// 🔹 Crear proceso con o sin imagen
router.post("/", upload, createproceso);

// 🔹 Subir o actualizar imagen de un proceso existente
router.post("/:id/upload-image", upload, async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No se subió ningún archivo" });
    }

    // 👇 directamente subimos con nuestro helper (ya convierte a WebP y optimiza)
    const result = await uploadImage(req.file.buffer, "procesos");

    // Guardar en la BD
    const image = await prisma.image.create({
      data: {
        url: result.secure_url,
        procesos: { connect: { id: parseInt(id) } },
      },
      include: { procesos: true }, // opcional
    });

    res.status(201).json(image);
  } catch (error) {
    console.error("❌ Error al subir imagen:", error);
    res.status(500).json({ message: "Error al subir imagen", error });
  }
});



module.exports = router;
