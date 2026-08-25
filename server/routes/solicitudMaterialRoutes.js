const express = require("express");
const controller = require("../controllers/solicitudMaterialController");
const asyncHandler = require("../middlewares/asyncHandler");
const { requireRoles } = require("../middlewares/authorization");

const router = express.Router();
router.get("/", asyncHandler(controller.list));
router.get("/:id(\\d+)", asyncHandler(controller.getById));
router.post("/", asyncHandler(controller.create));
router.patch(
  "/:id(\\d+)/estado",
  requireRoles("SUPER_ADMIN", "ADMIN_PLANTA", "SUPERVISOR", "ALMACEN"),
  asyncHandler(controller.updateStatus)
);

module.exports = router;
