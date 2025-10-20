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
exports.getPatientHistory = exports.getMedicalRecordDetail = exports.getPatientMedicalRecords = void 0;
const MedicalRecord_1 = __importDefault(require("../models/MedicalRecord"));
// Patient: Lấy hồ sơ bệnh án của bệnh nhân
const getPatientMedicalRecords = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId } = req.query;
        if (!patientId) {
            res.status(400).json({ message: "Thiếu patientId" });
            return;
        }
        // Chỉ lấy các bệnh án đã hoàn thành
        const records = yield MedicalRecord_1.default.find({
            patient: patientId,
            status: "completed", // Chỉ hiển thị bệnh án đã hoàn thành
        })
            .populate("doctor", "name specialty workplace")
            .populate("patient", "name email phone")
            .sort({ createdAt: -1 })
            .lean();
        res.json(records);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy hồ sơ bệnh án", error });
    }
});
exports.getPatientMedicalRecords = getPatientMedicalRecords;
// Patient: Lấy chi tiết hồ sơ bệnh án
const getMedicalRecordDetail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { patientId } = req.query;
        if (!patientId) {
            res.status(400).json({ message: "Thiếu patientId" });
            return;
        }
        // Chỉ cho phép xem bệnh án đã hoàn thành - trả về tất cả thông tin
        const record = yield MedicalRecord_1.default.findOne({
            _id: id,
            patient: patientId,
            status: "completed", // Chỉ cho phép xem bệnh án đã hoàn thành
        })
            .populate("doctor", "name specialty workplace")
            .populate("patient", "name email phone")
            .lean(); // Sử dụng lean() để trả về plain object với tất cả fields
        if (!record) {
            res.status(404).json({
                message: "Không tìm thấy hồ sơ bệnh án hoặc bệnh án chưa hoàn thành",
            });
            return;
        }
        res.json(record);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy chi tiết hồ sơ bệnh án", error });
    }
});
exports.getMedicalRecordDetail = getMedicalRecordDetail;
// Patient: Lấy lịch sử khám bệnh
const getPatientHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId } = req.query;
        if (!patientId) {
            res.status(400).json({ message: "Thiếu patientId" });
            return;
        }
        // Chỉ lấy lịch sử các bệnh án đã hoàn thành
        const records = yield MedicalRecord_1.default.find({
            patient: patientId,
            status: "completed", // Chỉ hiển thị bệnh án đã hoàn thành
        })
            .populate("doctor", "name specialty")
            .select("diagnosis treatment createdAt completedAt")
            .sort({ completedAt: -1 }) // Sắp xếp theo ngày hoàn thành
            .limit(10)
            .lean();
        res.json(records);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy lịch sử khám bệnh", error });
    }
});
exports.getPatientHistory = getPatientHistory;
