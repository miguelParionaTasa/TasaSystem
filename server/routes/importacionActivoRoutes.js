const express = require("express");
const upload = require("../config/multer");
const controller = require("../controllers/importacionActivoController");
const asyncHandler = require("../middlewares/asyncHandler");

const router = express.Router();
router.get("/plantilla", controller.downloadTemplate);
router.post("/", upload.excel, asyncHandler(controller.importAssets));

module.exports = router;
