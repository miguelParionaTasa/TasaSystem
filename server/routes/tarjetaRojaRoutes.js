const express = require("express");
const upload = require("../config/multer");
const prisma = require("../controllers/prisma");
const { uploadImage } = require("../config/cloudinary");

const {
  createTarjetaRoja,
  getTarjetasRojas,
  getTarjetaRojaById,
  updateTarjetaRoja,
  deleteTarjetaRoja,
  getTarjetaRojaHistorial,
  uploadTarjetaRojaImage,
} = require("../controllers/tarjetaRojaController");

const router = express.Router();

// ------------------------
// CRUD
// ------------------------
router.get("/", getTarjetasRojas);
router.get("/:id", getTarjetaRojaById);
router.post("/", upload, createTarjetaRoja);
router.put("/:id", updateTarjetaRoja);
router.delete("/:id", deleteTarjetaRoja);

// ------------------------
// Imagen
// ------------------------
router.post("/:id/upload-image", upload, uploadTarjetaRojaImage);

// ------------------------
// Historial
// ------------------------
router.get("/:id/historial", getTarjetaRojaHistorial);

module.exports = router;
