const express = require("express");
const upload = require("../config/multer");
const asyncHandler = require("../middlewares/asyncHandler");
const { requireRoles } = require("../middlewares/authorization");

const {
  importExcelOTBot,
  getAllOTBot,
  getOTByNumero,
  crearOTConsumible,
  asignarOT
} = require("../controllers/otBotController");

const router = express.Router();

// importar excel
router.post("/import", upload.excel, asyncHandler(importExcelOTBot));

// obtener todas las OT
router.get("/", asyncHandler(getAllOTBot));
// POST para crear un pedido
router.post("/", asyncHandler(crearOTConsumible));

router.patch("/asignar/:otNumero/:telegramUserId", requireRoles("SUPER_ADMIN", "ADMIN_PLANTA"), asignarOT);

router.get("/numero/:otNumero", asyncHandler(getOTByNumero));

module.exports = router;
