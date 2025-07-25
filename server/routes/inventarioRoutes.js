const express = require("express");
const router = express.Router();
const upload = require("../config/multer"); // Multer con memoryStorage
const {
  salidaDeItem,
  createInventarioItem,
  getInventarioItems,
  getInventarioItemById,
  updateInventarioItem,
  deleteInventarioItem,
  addHistorialToItem,
  getHistorialByItemId,
} = require("../controllers/inventarioController");

// ---- RUTAS INVENTARIO ----

// Crear un item de inventario (imagen opcional)
router.post("/", upload, createInventarioItem);

// Obtener todos los items
router.get("/", getInventarioItems);

// Obtener un item por ID
router.get("/:id", getInventarioItemById);

// Actualizar un item (imagen opcional)
router.put("/:id", upload, updateInventarioItem);

// Eliminar un item
router.delete("/:id", deleteInventarioItem);

// ---- RUTAS HISTORIAL ----

// Agregar historial a un item
router.post("/historial", addHistorialToItem);

// Obtener historial de un item
router.get("/:inventarioId/historial", getHistorialByItemId);

router.post('/salida', salidaDeItem); // nuevo
module.exports = router;
