const express = require("express");
const { listUsers, getUser } = require("../controllers/userController");
const asyncHandler = require("../middlewares/asyncHandler");

const router = express.Router();
router.get("/", asyncHandler(listUsers));
router.get("/:id", asyncHandler(getUser));
module.exports = router;
