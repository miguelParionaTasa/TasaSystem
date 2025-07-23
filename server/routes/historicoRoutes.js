const express = require('express');
const {
  getAllHistoricos,
  getHistoricosPorZona,
} = require('../controllers/HistoricoController');

const router = express.Router();

// GET /historico → trae todos
router.get('/', getAllHistoricos);

// GET /historico/filtrar → filtra por zonaId y/o ubicacionId
router.get('/filtrar', getHistoricosPorZona);

module.exports = router;
