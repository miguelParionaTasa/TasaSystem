const express = require("express");
const upload = require("../config/multer"); // tu configuración Multer
const prisma = require("../controllers/prisma");
const cloudinary = require("../config/cloudinary");
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
    if (!req.file) return res.status(400).json({ message: "No se subió ningún archivo" });

    const fileBase64 = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;
    const dataURI = `data:${mimeType};base64,${fileBase64}`;

    const result = await cloudinary.uploader.upload(dataURI, { folder: "atributos" });

    const image = await prisma.image.create({
      data: {
        url: result.secure_url,
        atributos: { connect: { id: parseInt(id) } }, // relaciona la imagen con el atributo
      },
    });

    res.status(201).json(image);
  } catch (error) {
    console.error("❌ Error al subir imagen:", error);
    res.status(500).json({ message: "Error al subir imagen", error });
  }
});

module.exports = router;
