"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const middlewares_1 = require("../middlewares");
const router = (0, express_1.Router)();
// Admin auth routes
router.post("/login", controllers_1.adminLogin);
router.get("/profile", middlewares_1.verifyAdminToken, controllers_1.getAdminProfile);
exports.default = router;
