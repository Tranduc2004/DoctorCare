"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../../../shared/controllers/authController");
const router = (0, express_1.Router)();
router.post("/forgot-password", authController_1.forgotPassword);
router.post("/reset-password", authController_1.resetPassword);
exports.default = router;
