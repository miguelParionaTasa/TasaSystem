const express = require("express");
const { crearOTConsumible, obtenerOTConsumibles } = require("../controllers/otBotController");
const router = express.Router();

// Crear un nuevo consumible
router.post("/", crearOTConsumible);

// Obtener todos los consumibles
router.get("/", obtenerOTConsumibles);

module.exports = router;