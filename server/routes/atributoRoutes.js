const express = require("express");
const upload = require("../config/multer"); // tu configuración Multer
const prisma = require("../controllers/prisma");
const { uploadImage } = require("../config/cloudinary");
const {
  createAtributo,
  getAllAtributos,
  getAtributoById,
  updateAtributo,
  deleteAtributo,
  getAtributoHistorial,
  searchAtributos,
  uploadAtributoImage,
} = require("../controllers/atributoController");

const authMiddleware = require("../middlewares/auth");

const router = express.Router();

// 🔹 Rutas CRUD básicas
router.get("/", getAllAtributos);

// 🔹 Rutas de búsqueda y historial
router.get("/search", searchAtributos);
router.get("/:id/historial", getAtributoHistorial);

// 🔹 Rutas con parámetro después
router.get("/:id", getAtributoById);
router.put("/:id", updateAtributo);
router.delete("/:id", deleteAtributo);

// 🔹 Crear atributo con o sin imagen
router.post("/", upload, createAtributo);

// 🔹 Subir o actualizar imagen de un atributo existente
router.post("/:id/upload-image", upload, async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No se subió ningún archivo" });
    }

    // 👇 directamente subimos con nuestro helper (ya convierte a WebP y optimiza)
    const result = await uploadImage(req.file.buffer, "atributos");

    // Guardar en la BD
    const image = await prisma.image.create({
      data: {
        url: result.secure_url,
        atributos: { connect: { id: parseInt(id) } },
      },
      include: { atributos: true }, // opcional
    });

    res.status(201).json(image);
  } catch (error) {
    console.error("❌ Error al subir imagen:", error);
    res.status(500).json({ message: "Error al subir imagen", error });
  }
});



module.exports = router;
