const cloudinary = require("cloudinary").v2;

// Configurar las credenciales de Cloudinary usando variables de entorno
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * 📌 Helper para subir imágenes comprimidas en formato WebP
 * @param {Buffer} fileBuffer - El buffer del archivo (ej: req.file.buffer de multer)
 * @param {String} folder - Carpeta en Cloudinary (por defecto "atributos")
 */
const uploadImage = async (fileBuffer, folder = "atributos") => {
  const dataURI = `data:image/png;base64,${fileBuffer.toString("base64")}`;

  return await cloudinary.uploader.upload(dataURI, {
    folder,
    format: "webp",        // Fuerza salida en WebP
    quality: "auto:good",  // Compresión automática
    fetch_format: "auto",  // Ajusta al mejor formato posible
    transformation: [
      { width: 1000, height: 1000, crop: "limit" } // limita resolución gigante
    ]
  });
};

module.exports = { cloudinary, uploadImage };
