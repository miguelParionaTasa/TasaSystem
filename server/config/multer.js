const path = require("node:path");
const multer = require("multer");
const { validatePlantReferenceBody } = require("../middlewares/plantReferences");

const storage = multer.memoryStorage();
const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const EXCEL_MIMES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const createUpload = ({ allowedMimes, extensions, maxBytes }) => {
  const middleware = multer({
    storage,
    limits: { fileSize: maxBytes, files: 1, fields: 50 },
    fileFilter(req, file, cb) {
      const extension = path.extname(file.originalname || "").toLowerCase();
      const allowed = allowedMimes.has(file.mimetype) && extensions.includes(extension);
      if (!allowed) {
        const error = new Error("Tipo de archivo no permitido.");
        error.code = "INVALID_FILE_TYPE";
        return cb(error);
      }
      return cb(null, true);
    },
  }).single("image");

  return (req, res, next) => middleware(req, res, async (error) => {
    if (error) return next(error);
    if (req.user) {
      req.body = req.body || {};
      req.body.userId = req.user.id;
    }
    try {
      await validatePlantReferenceBody(req);
      return next();
    } catch (validationError) {
      return next(validationError);
    }
  });
};

const documentUpload = createUpload({
  allowedMimes: IMAGE_MIMES,
  extensions: [".jpg", ".jpeg", ".png", ".webp", ".pdf"],
  maxBytes: 8 * 1024 * 1024,
});

documentUpload.excel = createUpload({
  allowedMimes: EXCEL_MIMES,
  extensions: [".xlsx"],
  maxBytes: 12 * 1024 * 1024,
});

module.exports = documentUpload;
