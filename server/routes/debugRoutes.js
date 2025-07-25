// debugRoutes.js
const express = require('express');
const cloudinary = require('../config/cloudinary'); // tu config existente
const router = express.Router();

router.get('/cloudinary-ping', async (req, res) => {
  try {
    const pong = await cloudinary.api.ping(); // requiere credenciales admin válidas
    res.json({ ok: true, pong });
  } catch (e) {
    console.error('Cloudinary ping error:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
