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
// 🔹 Subir o actualizar imagen de una clínica existente
router.post("/:id/upload-image", (req, res) => {
  upload(req, res, async (err) => {
    try {
      // 🧩 1️⃣ Manejo de errores de Multer
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res
            .status(400)
            .json({ message: "El archivo excede el tamaño máximo de 2 MB." });
        }
        return res
          .status(500)
          .json({ message: "Error al procesar el archivo.", requestId: req.requestId });
      }

      const { id } = req.params;

      // 🧩 2️⃣ Verificar si se subió archivo
      if (!req.file) {
        return res.status(400).json({ message: "No se subió ningún archivo." });
      }

      // 🧩 3️⃣ Subir imagen optimizada a Cloudinary
      const result = await uploadImage(req.file.buffer, "clinicas");

      // 🧩 4️⃣ Guardar referencia en la BD
      const image = await prisma.image.create({
        data: {
          url: result.secure_url,
          clinica: { connect: { id: parseInt(id) } },
        },
        include: { clinica: true },
      });

      // 🧩 5️⃣ Responder éxito
      res.status(201).json(image);
    } catch (error) {
      console.error("❌ Error al subir imagen:", error);
      res
        .status(500)
        .json({ message: "Error al subir imagen", requestId: req.requestId });
    }
  });
});

module.exports = router;
