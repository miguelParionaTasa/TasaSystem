// config/multer.js
const multer = require("multer");

// Usar almacenamiento en memoria (en lugar de en disco)
const storage = multer.memoryStorage(); // Guarda los archivos en memoria

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // ⛔ máximo 2 MB
}).single("image"); // "image" es el campo del formulario

module.exports = upload;
