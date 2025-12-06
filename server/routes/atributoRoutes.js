const express = require("express");
const upload = require("../config/multer"); // tu configuración Multer
const prisma = require("../controllers/prisma");
const { uploadImage, uploadPdf } = require("../config/cloudinary");
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
router.post("/:id/upload-file", upload, async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No se subió ningún archivo" });
    }

    // Detectar tipo MIME
    const isPdf = req.file.mimetype === "application/pdf";

    // Subir a Cloudinary
    const result = isPdf
      ? await uploadPdf(req.file.buffer, "atributos")
      : await uploadImage(req.file.buffer, "atributos");

    // Guardar en tabla image (usa tu relación REAL)
    const file = await prisma.image.create({
      data: {
        url: result.secure_url,
        tipo: isPdf ? "PDF" : "IMAGEN",
        // 🔥 ESTA ES LA CORRECCIÓN CLAVE
        atributos: { connect: { id: parseInt(id) } },
      },
      include: { atributos: true },
    });

    return res.status(201).json(file);
  } catch (error) {
    console.error("❌ Error al subir archivo:", error);
    res.status(500).json({ message: "Error al subir archivo", error });
  }
});



module.exports = router;
