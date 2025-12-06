const cloudinary = require("cloudinary").v2;

// Configurar credenciales
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Subir imagen WebP optimizada
 */
const uploadImage = async (fileBuffer, options = {}) => {
  const { folder = "atributos", width = 1000, height = 1000, quality = "auto:best", public_id } = options;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        format: "webp",
        quality,
        fetch_format: "auto",
        transformation: [{ width, height, crop: "limit" }],
        public_id,
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Subir PDF como imagen de alta calidad (PNG)
 */
const uploadPdfAsImage = async (fileBuffer, options = {}) => {
  const { folder = "atributos-pdf", width = 2000, height = 2000, quality = "auto:best", public_id } = options;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image", // importante: tratar PDF como imagen
        format: "png",          // primera página como imagen
        quality,
        fetch_format: "auto",
        transformation: [{ width, height, crop: "limit" }],
        public_id,
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Subir archivo según tipo
 */
const uploadFile = async (fileBuffer, mimetype, options = {}) => {
  if (mimetype === "application/pdf") {
    return uploadPdfAsImage(fileBuffer, options);
  } else {
    return uploadImage(fileBuffer, options);
  }
};

module.exports = { cloudinary, uploadImage, uploadPdfAsImage, uploadFile };
