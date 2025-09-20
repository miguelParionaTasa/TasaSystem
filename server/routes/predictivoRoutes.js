const express = require("express");
const upload = require("../config/multer");
const cloudinary = require("../config/cloudinary");
const prisma = require("../controllers/prisma");
const {
  createPredictivo,
  getAllPredictivos,
  getPredictivoById,
  updatePredictivo,
  deletePredictivo,
  searchPredictivos,
} = require("../controllers/predictivoController");

const router = express.Router();

// CRUD
router.post("/", upload, createPredictivo);
router.get("/", getAllPredictivos);
router.get("/search", searchPredictivos);
router.get("/:id", getPredictivoById);
router.put("/:id", upload, updatePredictivo);
router.delete("/:id", deletePredictivo);

// === Subir imagen ===
router.post("/:id/upload-image", upload, async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ message: "No se subió ningún archivo" });

    // Convertir buffer a base64 y formar un Data URI
    const fileBase64 = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype; // ej: "image/png"
    const dataURI = `data:${mimeType};base64,${fileBase64}`;

    // Subir a Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, { folder: "predictivos" });

    // Guardar la URL en Prisma
    const image = await prisma.image.create({
  data: {
    url: result.secure_url,
    predictivos: {
      connect: { id: parseInt(id) }, // relaciona la imagen con el predictivo existente
    },
  },
});


    res.status(201).json(image);
  } catch (error) {
    console.error("❌ Error al subir imagen:", error);
    res.status(500).json({ message: "Error al subir imagen", error });
  }
});


module.exports = router;
