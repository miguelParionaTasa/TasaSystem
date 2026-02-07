const express = require("express");
const upload = require("../config/multer");

const {
  importExcel,
  getAllMovimientos,
  getMovimientosByOT
} = require("../controllers/otMovimientoSapController"); // 👈 EXACTO

const router = express.Router();

// Importar Excel
router.post("/import", upload, importExcel);


// Obtener todos
router.get("/", getAllMovimientos);

// Obtener por OT
router.get("/:otNumero", getMovimientosByOT);

module.exports = router;
