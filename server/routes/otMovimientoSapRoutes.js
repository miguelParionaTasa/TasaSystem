const express = require("express");
const upload = require("../config/multer");
const asyncHandler = require("../middlewares/asyncHandler");

const {
  importExcel,
  getAllMovimientos,
  getMovimientosByOT
} = require("../controllers/otMovimientoSapController"); // 👈 EXACTO

const router = express.Router();

// Importar Excel
router.post("/import", upload.excel, asyncHandler(importExcel));


// Obtener todos
router.get("/", asyncHandler(getAllMovimientos));

// Obtener por OT
router.get("/:otNumero", asyncHandler(getMovimientosByOT));

module.exports = router;
