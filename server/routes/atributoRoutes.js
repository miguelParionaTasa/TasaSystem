const express = require("express");
const {
  createAtributo,
  getAllAtributos,
  getAtributoById,
  updateAtributo,
  deleteAtributo,
  getAtributoHistorial,
  searchAtributos
} = require("../controllers/atributoController");

const authMiddleware = require("../middlewares/auth");

const router = express.Router();

// CRUD
router.post("/", createAtributo);
router.get("/", getAllAtributos);

// 🔹 rutas específicas primero
router.get("/search", searchAtributos);
router.get("/:id/historial", getAtributoHistorial);

// 🔹 rutas con parámetro después
router.get("/:id", getAtributoById);
router.put("/:id", updateAtributo);
router.delete("/:id", deleteAtributo);

module.exports = router;
