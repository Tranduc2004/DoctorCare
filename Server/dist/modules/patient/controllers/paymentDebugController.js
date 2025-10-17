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
exports.computeVnPayHash = void 0;
const vnpayService_1 = require("../../../shared/services/vnpayService");
// Debug endpoint: compute signData and secure hash for given params
const computeVnPayHash = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const params = req.body || {};
        const result = vnpayService_1.vnpayService.computeHashForParams(params);
        res.json(Object.assign({ success: true }, result));
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
exports.computeVnPayHash = computeVnPayHash;
exports.default = exports.computeVnPayHash;
