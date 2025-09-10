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
exports.getAllDoctors = exports.getDoctorById = exports.getDoctorsBySpecialty = void 0;
const Doctor_1 = __importDefault(require("../models/Doctor"));
// Lấy danh sách bác sĩ theo chuyên khoa
const getDoctorsBySpecialty = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { specialty } = req.query;
        let query = {};
        if (specialty) {
            // Tìm kiếm theo ID chuyên khoa (vì trong model Doctor, specialty lưu ID)
            query = { specialty: specialty };
        }
        const doctors = yield Doctor_1.default.find(query)
            .select("_id name specialty workplace experience email phone description consultationFee avatar")
            .sort({ name: 1 })
            .lean();
        res.json(doctors);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy danh sách bác sĩ", error });
    }
});
exports.getDoctorsBySpecialty = getDoctorsBySpecialty;
// Lấy thông tin chi tiết một bác sĩ
const getDoctorById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const doctor = yield Doctor_1.default.findById(id).select("-password").lean();
        if (!doctor) {
            res.status(404).json({ message: "Không tìm thấy bác sĩ" });
            return;
        }
        res.json(doctor);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy thông tin bác sĩ", error });
    }
});
exports.getDoctorById = getDoctorById;
// Lấy tất cả bác sĩ (cho admin)
const getAllDoctors = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const doctors = yield Doctor_1.default.find()
            .select("_id name email specialty workplace experience license avatar")
            .sort({ name: 1 })
            .lean();
        res.json(doctors);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy danh sách bác sĩ", error });
    }
});
exports.getAllDoctors = getAllDoctors;
