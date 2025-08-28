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
exports.getMedicalRecordDetail = exports.getDoctorMedicalRecords = exports.updateMedicalRecord = exports.getPatientMedicalRecords = exports.createMedicalRecord = void 0;
const MedicalRecord_1 = __importDefault(require("../../patient/models/MedicalRecord"));
// Doctor: Tạo hồ sơ bệnh án mới
const createMedicalRecord = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patient, doctor, diagnosis, treatment, notes } = req.body;
        if (!patient || !doctor || !diagnosis || !treatment) {
            res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
            return;
        }
        const record = new MedicalRecord_1.default({
            patient,
            doctor,
            diagnosis,
            treatment,
            notes: notes || "",
        });
        yield record.save();
        res.status(201).json({
            message: "Tạo hồ sơ bệnh án thành công",
            record,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi tạo hồ sơ bệnh án", error });
    }
});
exports.createMedicalRecord = createMedicalRecord;
// Doctor: Lấy hồ sơ bệnh án của bệnh nhân
const getPatientMedicalRecords = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId, doctorId } = req.query;
        if (!patientId) {
            res.status(400).json({ message: "Thiếu patientId" });
            return;
        }
        const records = yield MedicalRecord_1.default.find({ patient: patientId })
            .populate("doctor", "name specialty")
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
// Doctor: Cập nhật hồ sơ bệnh án
const updateMedicalRecord = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { doctorId } = req.body;
        const updateData = req.body;
        // Kiểm tra xem hồ sơ có thuộc về bác sĩ này không
        const record = yield MedicalRecord_1.default.findOne({ _id: id, doctor: doctorId });
        if (!record) {
            res.status(404).json({ message: "Không tìm thấy hồ sơ bệnh án" });
            return;
        }
        const updatedRecord = yield MedicalRecord_1.default.findByIdAndUpdate(id, updateData, { new: true }).populate("patient doctor", "name email");
        res.json(updatedRecord);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi cập nhật hồ sơ bệnh án", error });
    }
});
exports.updateMedicalRecord = updateMedicalRecord;
// Doctor: Lấy tất cả hồ sơ bệnh án của bác sĩ
const getDoctorMedicalRecords = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { doctorId } = req.query;
        if (!doctorId) {
            res.status(400).json({ message: "Thiếu doctorId" });
            return;
        }
        const records = yield MedicalRecord_1.default.find({ doctor: doctorId })
            .populate("patient", "name email phone")
            .sort({ createdAt: -1 })
            .lean();
        res.json(records);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy hồ sơ bệnh án", error });
    }
});
exports.getDoctorMedicalRecords = getDoctorMedicalRecords;
// Doctor: Lấy chi tiết hồ sơ bệnh án
const getMedicalRecordDetail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { doctorId } = req.query;
        if (!doctorId) {
            res.status(400).json({ message: "Thiếu doctorId" });
            return;
        }
        const record = yield MedicalRecord_1.default.findOne({ _id: id, doctor: doctorId })
            .populate("patient", "name email phone")
            .populate("doctor", "name specialty");
        if (!record) {
            res.status(404).json({ message: "Không tìm thấy hồ sơ bệnh án" });
            return;
        }
        res.json(record);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy chi tiết hồ sơ bệnh án", error });
    }
});
exports.getMedicalRecordDetail = getMedicalRecordDetail;
