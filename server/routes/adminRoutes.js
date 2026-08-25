const express = require("express");
const controller = require("../controllers/adminController");
const { requireRoles } = require("../middlewares/authorization");
const asyncHandler = require("../middlewares/asyncHandler");

const router = express.Router();
const admins = requireRoles("SUPER_ADMIN", "ADMIN_PLANTA");

router.get("/plantas", asyncHandler(controller.getPlants));
router.post("/plantas", requireRoles("SUPER_ADMIN"), asyncHandler(controller.createPlant));
router.get("/usuarios", admins, asyncHandler(controller.getUsers));
router.post("/usuarios", admins, asyncHandler(controller.createUser));
router.patch("/usuarios/:id", admins, asyncHandler(controller.updateUser));
router.post("/usuarios/:id/reset-password", admins, asyncHandler(controller.resetPassword));
router.get("/temporadas", asyncHandler(controller.getSeasons));
router.post("/temporadas", admins, asyncHandler(controller.createSeason));
router.post("/temporadas/:id/activar", admins, asyncHandler(controller.activateSeason));
router.get("/telegram", admins, asyncHandler(controller.getTelegramAccesses));
router.post("/telegram/:id/aprobar", admins, asyncHandler(controller.approveTelegramAccess));
router.post("/telegram/:id/revocar", admins, asyncHandler(controller.revokeTelegramAccess));
router.get("/importaciones", admins, asyncHandler(controller.getImports));
router.post("/activos/:id/transferir", requireRoles("SUPER_ADMIN"), asyncHandler(controller.transferAsset));

module.exports = router;
