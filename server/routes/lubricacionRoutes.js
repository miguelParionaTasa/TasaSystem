const express = require("express");
const {
  getUbicacionesByZona,
  getLubricantesByZona,
  getLubricaciones,
  deleteLubricacion,
  uploadImagen,
} = require("../controllers/lubricacionController");
const upload = require("../config/multer");

const router = express.Router();

router.get("/ubicaciones", getUbicacionesByZona);
router.get("/lubricantes", getLubricantesByZona);
router.get("/", getLubricaciones);
router.delete("/:id", deleteLubricacion);
router.put("/:id/imagen", upload, uploadImagen);

module.exports = router;
