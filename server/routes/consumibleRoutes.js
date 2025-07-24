const express = require('express');
const {
  searchConsumibles,
  createConsumible,
  getAllConsumibles,
  getConsumibleById,
  updateConsumible,
  deleteConsumible,
} = require('../controllers/consumibleController');

const authMiddleware = require('../middlewares/auth');

const router = express.Router();

// IMPORTANTES PRIMERO (más específicas)
router.get('/search', searchConsumibles);

// CRUD
router.post('/', createConsumible);
router.get('/', getAllConsumibles);

// Restringimos :id a dígitos para que no choque con /search
router.get('/:id(\\d+)', getConsumibleById);
router.put('/:id(\\d+)', updateConsumible);
router.delete('/:id(\\d+)', authMiddleware, deleteConsumible);

module.exports = router;
