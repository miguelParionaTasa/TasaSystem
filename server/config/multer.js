// config/multer.js
const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter(req, file, cb) {
    cb(null, true); // 🔥 aceptar imágenes + PDFs + cualquier archivo
  },
}).single("image"); // <-- MATCH con tu frontend

module.exports = upload;
