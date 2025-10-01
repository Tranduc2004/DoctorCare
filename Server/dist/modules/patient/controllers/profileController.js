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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertInsurance = exports.upsertProfile = exports.getProfile = void 0;
const PatientProfile_1 = __importDefault(require("../models/PatientProfile"));
const Insurance_1 = __importDefault(require("../models/Insurance"));
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId } = req.query;
        if (!patientId)
            return res.status(400).json({ message: "Thiếu patientId" });
        const profile = yield PatientProfile_1.default.findOne({ patientId }).lean();
        const insurance = yield Insurance_1.default.findOne({ patientId }).lean();
        res.json({ profile, insurance });
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy hồ sơ", error });
    }
});
exports.getProfile = getProfile;
const upsertProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId, profile } = req.body;
        if (!patientId)
            return res.status(400).json({ message: "Thiếu patientId" });
        const sanitized = Object.assign({}, (profile || {}));
        // Normalize numeric fields
        if (sanitized.heightCm != null)
            sanitized.heightCm = Number(sanitized.heightCm);
        if (sanitized.weightKg != null)
            sanitized.weightKg = Number(sanitized.weightKg);
        const doc = yield PatientProfile_1.default.findOneAndUpdate({ patientId }, { $set: Object.assign(Object.assign({}, sanitized), { patientId }) }, { new: true, upsert: true });
        res.json(doc);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lưu hồ sơ", error });
    }
});
exports.upsertProfile = upsertProfile;
const upsertInsurance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId, insurance } = req.body;
        if (!patientId)
            return res.status(400).json({ message: "Thiếu patientId" });
        console.log("Saving insurance data:", insurance);
        console.log("Image URL:", insurance === null || insurance === void 0 ? void 0 : insurance.imageUrl);
        // Always set verification status to pending when patient submits/updates
        const insuranceData = Object.assign(Object.assign({}, insurance), { patientId, verificationStatus: "pending", submittedAt: new Date(), submittedBy: patientId });
        const doc = yield Insurance_1.default.findOneAndUpdate({ patientId }, { $set: insuranceData }, { new: true, upsert: true });
        console.log("Saved insurance doc:", doc);
        res.json(Object.assign(Object.assign({}, doc), { message: "Thông tin BHYT đã được gửi chờ duyệt. Admin sẽ xem xét và phê duyệt trong thời gian sớm nhất." }));
    }
    catch (error) {
        console.error("Error saving insurance:", error);
        res.status(500).json({ message: "Lỗi lưu BHYT", error });
    }
});
exports.upsertInsurance = upsertInsurance;
