const express = require('express');
const { exportDatabase } = require('../controllers/exportController');

const router = express.Router();

router.get('/exportar', exportDatabase);

module.exports = router;
