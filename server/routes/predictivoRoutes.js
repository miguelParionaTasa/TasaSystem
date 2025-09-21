const express = require("express");
const upload = require("../config/multer");
const { uploadImage } = require("../config/cloudinary"); // helper centralizado
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
    const predictivoId = parseInt(id);

    if (isNaN(predictivoId)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No se subió ningún archivo" });
    }

    // 👇 Subir usando helper que convierte a WebP optimizado
    const result = await uploadImage(req.file.buffer, "predictivos");

    // Guardar en la BD
    const image = await prisma.image.create({
      data: {
        url: result.secure_url,
        predictivos: { connect: { id: predictivoId } },
      },
      include: { predictivos: true }, // opcional, si quieres devolver relación
    });

    res.status(201).json(image);
  } catch (error) {
    console.error("❌ Error al subir imagen:", error);
    res.status(500).json({ message: "Error al subir imagen" });
  }
});


module.exports = router;
