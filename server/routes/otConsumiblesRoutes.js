const express = require("express");
const { crearOTConsumible, obtenerOTConsumibles } = require("../controllers/otBotController");
const asyncHandler = require("../middlewares/asyncHandler");
const router = express.Router();

// Crear un nuevo consumible
router.post("/", asyncHandler(crearOTConsumible));

// Obtener todos los consumibles
router.get("/", asyncHandler(obtenerOTConsumibles));

module.exports = router;
