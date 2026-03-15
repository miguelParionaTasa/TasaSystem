const express = require("express");
const router = express.Router();
const { obtenerTelegramUsers } = require("../controllers/telegramUserController");

// GET /telegram-users -> devuelve todos los telegram users
router.get("/", obtenerTelegramUsers);

module.exports = router;