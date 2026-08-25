const express = require('express');
const {
  searchConsumibles,
  createConsumible,
  getAllConsumibles,
  getConsumibleById,
  updateConsumible,
  deleteConsumible,
} = require('../controllers/consumibleController');

const { requireRoles } = require('../middlewares/authorization');
const superAdmin = requireRoles('SUPER_ADMIN');

const router = express.Router();

// IMPORTANTES PRIMERO (más específicas)
router.get('/search', searchConsumibles);

// CRUD
router.post('/', superAdmin, createConsumible);
router.get('/', getAllConsumibles);

// Restringimos :id a dígitos para que no choque con /search
router.get('/:id(\\d+)', getConsumibleById);
router.put('/:id(\\d+)', superAdmin, updateConsumible);
router.delete('/:id(\\d+)', superAdmin, deleteConsumible);

module.exports = router;
