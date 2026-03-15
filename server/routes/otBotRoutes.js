const express = require("express");
const upload = require("../config/multer");

const {
  importExcelOTBot,
  getAllOTBot,
  getOTByNumero,
  crearOTConsumible,
  asignarOT
} = require("../controllers/otBotController");

const router = express.Router();

// importar excel
router.post("/import", upload, importExcelOTBot);

// obtener todas las OT
router.get("/", getAllOTBot);
// POST para crear un pedido
router.post("/", crearOTConsumible);

router.patch("/asignar/:otNumero/:telegramUserId", asignarOT);

router.get("/numero/:otNumero", getOTByNumero);

module.exports = router;