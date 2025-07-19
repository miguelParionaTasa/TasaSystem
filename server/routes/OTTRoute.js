const express = require("express");
const {
  createOTT,
  getAllOTTs,
  getOTTById,
  updateOTT,
  deleteOTT,
  updateTecnicosOT,
} = require("../controllers/OTTcontroller"); // Ajusta la ruta según tu estructura de archivos

const router = express.Router();

// Ruta para crear una nueva OT
router.post("/ots", createOTT);

router.put("/editar-tecnicos/:id", updateTecnicosOT);

// Ruta para obtener todas las OTs
router.get("/ots", getAllOTTs);

// Ruta para obtener una OT por ID
router.get("/ots/:id", getOTTById);

// Ruta para actualizar una OT
router.put("/ots/:id", updateOTT);

// Ruta para eliminar una OT
router.delete("/ots/:id", deleteOTT);

module.exports = router;
