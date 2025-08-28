"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const middlewares_1 = require("../middlewares");
const router = (0, express_1.Router)();
// Patient auth routes
router.post("/register", controllers_1.patientRegister);
router.post("/login", controllers_1.patientLogin);
router.get("/profile", middlewares_1.verifyPatientToken, controllers_1.getPatientProfile);
exports.default = router;
