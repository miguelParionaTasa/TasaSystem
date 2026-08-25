const express = require("express");
const authController = require("../controllers/authController");
const authenticateJWT = require("../middlewares/authenticateJWT");
const asyncHandler = require("../middlewares/asyncHandler");
const { validateMutationOrigin } = require("../middlewares/security");

const router = express.Router();
router.post("/login", validateMutationOrigin, asyncHandler(authController.login));
router.post("/logout", authenticateJWT, validateMutationOrigin, asyncHandler(authController.logout));
router.get("/me", authenticateJWT, authController.me);

module.exports = router;
