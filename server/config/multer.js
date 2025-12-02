// config/multer.js
const multer = require("multer");

// Guardar archivos en memoria
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // ✅ máximo 6 MB
}).single("image");

module.exports = upload;
