"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const computePricing_1 = require("../services/computePricing");
const router = (0, express_1.Router)();
router.post("/compute", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { serviceCode, doctorId, durationMin, startAt, bhytEligible, copayRate, } = req.body;
        const result = yield (0, computePricing_1.computeConsultPrice)({
            serviceCode,
            doctorId,
            durationMin,
            startAt,
            bhytEligible,
            copayRate,
        });
        res.json(result);
    }
    catch (err) {
        console.error("Pricing compute error:", err);
        res.status(400).json({ message: err.message || "Error computing price" });
    }
}));
exports.default = router;
