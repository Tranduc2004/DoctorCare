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
exports.getMedicalRecordsByDoctor = exports.getMedicalRecordsByPatient = exports.updateMedicalRecordStatus = exports.deleteMedicalRecord = exports.getMedicalRecordsStats = exports.getMedicalRecordById = exports.getAllMedicalRecords = void 0;
const MedicalRecord_1 = __importDefault(require("../../patient/models/MedicalRecord"));
// Get all medical records with pagination and filters
const getAllMedicalRecords = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10, status, doctorId, patientId, startDate, endDate, search, consultationType, } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Build filter object
        const filter = {};
        if (status) {
            filter.status = status;
        }
        if (doctorId) {
            filter.doctor = doctorId;
        }
        if (patientId) {
            filter.patient = patientId;
        }
        if (consultationType) {
            filter.consultationType = consultationType;
        }
        // Date range filter
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.createdAt.$lte = new Date(endDate);
            }
        }
        // Search filter (patient name, doctor name, diagnosis)
        if (search) {
            const searchRegex = new RegExp(search, "i");
            filter.$or = [
                { "patientInfo.fullName": searchRegex },
                { diagnosis: searchRegex },
                { preliminaryDiagnosis: searchRegex },
                { reasonForVisit: searchRegex },
            ];
        }
        // Get records with populated data
        const records = yield MedicalRecord_1.default.find(filter)
            .populate({
            path: "patient",
            select: "name email phone",
        })
            .populate({
            path: "doctor",
            select: "name email specialty workplace",
            populate: {
                path: "specialty",
                select: "name",
            },
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
        const total = yield MedicalRecord_1.default.countDocuments(filter);
        res.json({
            records,
            pagination: {
                current: pageNum,
                total: Math.ceil(total / limitNum),
                count: total,
                limit: limitNum,
            },
        });
    }
    catch (error) {
        console.error("Error getting medical records:", error);
        res.status(500).json({ error: "Lỗi khi lấy danh sách bệnh án" });
    }
});
exports.getAllMedicalRecords = getAllMedicalRecords;
// Get medical record by ID with full details
const getMedicalRecordById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const record = yield MedicalRecord_1.default.findById(id)
            .populate({
            path: "patient",
            select: "name email phone address birthYear gender",
        })
            .populate({
            path: "doctor",
            select: "name email specialty workplace phone",
            populate: {
                path: "specialty",
                select: "name description",
            },
        });
        if (!record) {
            return res.status(404).json({ error: "Không tìm thấy bệnh án" });
        }
        res.json(record);
    }
    catch (error) {
        console.error("Error getting medical record:", error);
        res.status(500).json({ error: "Lỗi khi lấy thông tin bệnh án" });
    }
});
exports.getMedicalRecordById = getMedicalRecordById;
// Get medical records statistics
const getMedicalRecordsStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { period = "month" } = req.query;
        // Calculate date range based on period
        const now = new Date();
        let startDate;
        switch (period) {
            case "week":
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case "month":
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case "year":
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        // Total records
        const totalRecords = yield MedicalRecord_1.default.countDocuments();
        // Records in period
        const recordsInPeriod = yield MedicalRecord_1.default.countDocuments({
            createdAt: { $gte: startDate },
        });
        // Completed records
        const completedRecords = yield MedicalRecord_1.default.countDocuments({
            status: "completed",
        });
        // Draft records
        const draftRecords = yield MedicalRecord_1.default.countDocuments({
            status: "draft",
        });
        // Records by consultation type
        const onlineRecords = yield MedicalRecord_1.default.countDocuments({
            consultationType: "online",
        });
        const offlineRecords = yield MedicalRecord_1.default.countDocuments({
            consultationType: "offline",
        });
        // Records by day in period (for charts)
        const recordsByDay = yield MedicalRecord_1.default.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { _id: 1 },
            },
        ]);
        // Most active doctors
        const topDoctors = yield MedicalRecord_1.default.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: "$doctor",
                    count: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: "doctors",
                    localField: "_id",
                    foreignField: "_id",
                    as: "doctor",
                },
            },
            {
                $unwind: "$doctor",
            },
            {
                $project: {
                    count: 1,
                    "doctor.name": 1,
                    "doctor.specialty": 1,
                },
            },
            {
                $sort: { count: -1 },
            },
            {
                $limit: 5,
            },
        ]);
        res.json({
            overview: {
                totalRecords,
                recordsInPeriod,
                completedRecords,
                draftRecords,
                onlineRecords,
                offlineRecords,
            },
            charts: {
                recordsByDay,
                topDoctors,
            },
        });
    }
    catch (error) {
        console.error("Error getting medical records stats:", error);
        res.status(500).json({ error: "Lỗi khi lấy thống kê bệnh án" });
    }
});
exports.getMedicalRecordsStats = getMedicalRecordsStats;
// Delete medical record (admin only)
const deleteMedicalRecord = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const record = yield MedicalRecord_1.default.findById(id);
        if (!record) {
            return res.status(404).json({ error: "Không tìm thấy bệnh án" });
        }
        yield MedicalRecord_1.default.findByIdAndDelete(id);
        res.json({ message: "Đã xóa bệnh án thành công" });
    }
    catch (error) {
        console.error("Error deleting medical record:", error);
        res.status(500).json({ error: "Lỗi khi xóa bệnh án" });
    }
});
exports.deleteMedicalRecord = deleteMedicalRecord;
// Update medical record status (admin only)
const updateMedicalRecordStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!["draft", "completed", "archived"].includes(status)) {
            return res.status(400).json({ error: "Trạng thái không hợp lệ" });
        }
        const record = yield MedicalRecord_1.default.findById(id);
        if (!record) {
            return res.status(404).json({ error: "Không tìm thấy bệnh án" });
        }
        record.status = status;
        if (status === "completed" && !record.completedAt) {
            record.completedAt = new Date();
        }
        yield record.save();
        res.json({ message: "Đã cập nhật trạng thái bệnh án", record });
    }
    catch (error) {
        console.error("Error updating medical record status:", error);
        res.status(500).json({ error: "Lỗi khi cập nhật trạng thái bệnh án" });
    }
});
exports.updateMedicalRecordStatus = updateMedicalRecordStatus;
// Get medical records by patient
const getMedicalRecordsByPatient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const records = yield MedicalRecord_1.default.find({ patient: patientId })
            .populate({
            path: "doctor",
            select: "name specialty",
            populate: {
                path: "specialty",
                select: "name",
            },
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
        const total = yield MedicalRecord_1.default.countDocuments({ patient: patientId });
        res.json({
            records,
            pagination: {
                current: pageNum,
                total: Math.ceil(total / limitNum),
                count: total,
                limit: limitNum,
            },
        });
    }
    catch (error) {
        console.error("Error getting patient medical records:", error);
        res.status(500).json({ error: "Lỗi khi lấy bệnh án của bệnh nhân" });
    }
});
exports.getMedicalRecordsByPatient = getMedicalRecordsByPatient;
// Get medical records by doctor
const getMedicalRecordsByDoctor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { doctorId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const records = yield MedicalRecord_1.default.find({ doctor: doctorId })
            .populate({
            path: "patient",
            select: "name email phone",
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
        const total = yield MedicalRecord_1.default.countDocuments({ doctor: doctorId });
        res.json({
            records,
            pagination: {
                current: pageNum,
                total: Math.ceil(total / limitNum),
                count: total,
                limit: limitNum,
            },
        });
    }
    catch (error) {
        console.error("Error getting doctor medical records:", error);
        res.status(500).json({ error: "Lỗi khi lấy bệnh án của bác sĩ" });
    }
});
exports.getMedicalRecordsByDoctor = getMedicalRecordsByDoctor;
