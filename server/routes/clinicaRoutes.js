const express = require("express");
const upload = require("../config/multer"); // configuración Multer
const prisma = require("../controllers/prisma");
const { uploadImage } = require("../config/cloudinary");

const {
  createClinica,
  getAllClinicas,
  getClinicaById,
  updateClinica,
  deleteClinica,
  getClinicaHistorial,
  searchClinicas,
  uploadClinicaImage,
} = require("../controllers/clinicaController");

const authMiddleware = require("../middlewares/auth");

const router = express.Router();

// 🔹 Rutas CRUD básicas
router.get("/", getAllClinicas);

// 🔹 Rutas de búsqueda y historial
router.get("/search", searchClinicas);
router.get("/:id/historial", getClinicaHistorial);

// 🔹 Rutas con parámetro después
router.get("/:id", getClinicaById);
router.put("/:id", updateClinica);
router.delete("/:id", deleteClinica);

// 🔹 Crear clínica con o sin imagen
router.post("/", upload, createClinica);

// 🔹 Subir o actualizar imagen de una clínica existente
router.post("/:id/upload-image", upload, async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No se subió ningún archivo" });
    }

    // 👇 Subir imagen optimizada a Cloudinary
    const result = await uploadImage(req.file.buffer, "clinicas");

    // Guardar referencia en la BD
    const image = await prisma.image.create({
      data: {
        url: result.secure_url,
        clinicas: { connect: { id: parseInt(id) } },
      },
      include: { clinicas: true }, // opcional
    });

    res.status(201).json(image);
  } catch (error) {
    console.error("❌ Error al subir imagen:", error);
    res.status(500).json({ message: "Error al subir imagen", error });
  }
});

module.exports = router;
