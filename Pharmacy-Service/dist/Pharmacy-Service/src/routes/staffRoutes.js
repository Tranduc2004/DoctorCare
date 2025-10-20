"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const staffController_1 = require("../controllers/staffController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post("/register", staffController_1.registerStaff);
router.post("/login", staffController_1.loginStaff);
router.get("/profile", auth_1.authMiddleware, staffController_1.getMyProfile);
exports.default = router;
//# sourceMappingURL=staffRoutes.js.map