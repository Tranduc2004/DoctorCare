"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profileController_1 = require("../controllers/profileController");
const router = (0, express_1.Router)();
router.get("/profile", profileController_1.getProfile);
router.put("/profile", profileController_1.upsertProfile);
router.put("/insurance", profileController_1.upsertInsurance);
exports.default = router;
