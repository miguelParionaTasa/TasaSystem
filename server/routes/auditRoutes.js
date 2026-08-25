const express = require("express");
const { getAudits } = require("../controllers/adminController");
const asyncHandler = require("../middlewares/asyncHandler");

const router = express.Router();
router.get("/", asyncHandler(getAudits));
module.exports = router;
