"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentAdminController_1 = require("../controllers/paymentAdminController");
const adminAuth_1 = require("../middlewares/adminAuth");
const router = (0, express_1.Router)();
// POST /api/admin/payments/:invoiceId/create-payos-order
router.post("/:invoiceId/create-payos-order", adminAuth_1.verifyAdminToken, paymentAdminController_1.createPayosOrderForInvoice);
exports.default = router;
