// routes/otConsumibleRoutes.js
const express = require('express');
const {
  createOTConsumible,
  getAllOTConsumibles,
  getOTConsumibleById,
  updateOTConsumible,
  deleteOTConsumible,
  getConsumiblesByOTMaximo ,
} = require('../controllers/otConsumibleController');
const authMiddleware = require('../middlewares/auth'); 
const router = express.Router();

// Ruta para crear un nuevo OTConsumible
router.post('/', createOTConsumible);
router.get('/by-otmaximo/:otmaximo', getConsumiblesByOTMaximo);

// Ruta para obtener todos los OTConsumibles
router.get('/', getAllOTConsumibles);

// Ruta para obtener un OTConsumible por ID
router.get('/:id', getOTConsumibleById);

// Ruta para actualizar un OTConsumible por ID
router.put('/:id', updateOTConsumible);

// Ruta para eliminar un OTConsumible por ID
router.delete('/:id', authMiddleware,deleteOTConsumible);

module.exports = router;