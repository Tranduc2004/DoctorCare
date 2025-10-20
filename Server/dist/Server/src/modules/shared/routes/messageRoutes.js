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
const express_1 = require("express");
const message_1 = __importDefault(require("../../../shared/models/message"));
const notificationService_1 = require("../../../shared/services/notificationService");
const Appointment_1 = __importDefault(require("../../patient/models/Appointment"));
const Patient_1 = __importDefault(require("../../patient/models/Patient"));
const router = (0, express_1.Router)();
// Gửi tin nhắn (bác sĩ hoặc bệnh nhân)
router.post("/send", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let { appointmentId, doctorId, patientId, senderRole, content } = req.body;
        if (!doctorId || !patientId || !senderRole || !content) {
            return res.status(400).json({ message: "Thiếu dữ liệu" });
        }
        // Nếu thiếu appointmentId: lấy lịch hẹn gần nhất giữa bác sĩ và bệnh nhân
        if (!appointmentId) {
            const latestAppointment = yield Appointment_1.default.findOne({
                doctorId,
                patientId,
            })
                .sort({ createdAt: -1 })
                .select("_id")
                .lean();
            if (!latestAppointment) {
                return res.status(400).json({
                    message: "Không tìm thấy lịch hẹn giữa bác sĩ và bệnh nhân",
                });
            }
            appointmentId = String(latestAppointment._id);
        }
        const doc = yield message_1.default.create({
            appointmentId,
            doctorId,
            patientId,
            senderRole,
            content,
            isReadByDoctor: senderRole === "doctor",
            isReadByPatient: senderRole === "patient",
        });
        // Create a user notification for the recipient (best-effort, non-blocking)
        try {
            const recipientId = senderRole === "doctor" ? patientId : doctorId;
            const title = senderRole === "doctor"
                ? "Bác sĩ đã gửi tin nhắn"
                : "Bạn nhận được tin nhắn từ bệnh nhân";
            yield (0, notificationService_1.createNotification)({
                userId: String(recipientId),
                type: "chat",
                title,
                body: (content === null || content === void 0 ? void 0 : content.slice(0, 200)) || "Bạn có tin nhắn mới",
            });
        }
        catch (err) {
            console.error("Create notification for message failed:", err);
        }
        return res.status(201).json(doc);
    }
    catch (e) {
        return res.status(500).json({ message: "Lỗi gửi tin nhắn", error: e });
    }
}));
// Danh sách tin nhắn theo cặp doctor-patient (tuỳ chọn lọc theo appointment)
router.get("/thread", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { doctorId, patientId, appointmentId } = req.query;
        if (!doctorId || !patientId) {
            return res.status(400).json({ message: "Thiếu doctorId hoặc patientId" });
        }
        const query = { doctorId, patientId };
        if (appointmentId)
            query.appointmentId = appointmentId;
        const list = yield message_1.default.find(query).sort({ createdAt: 1 }).lean();
        return res.json(list);
    }
    catch (e) {
        return res.status(500).json({ message: "Lỗi lấy tin nhắn", error: e });
    }
}));
// Đánh dấu đã đọc
router.post("/mark-read", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { doctorId, patientId, role } = req.body;
        if (!doctorId || !patientId || !role) {
            return res.status(400).json({ message: "Thiếu dữ liệu" });
        }
        const update = {};
        if (role === "doctor")
            update.isReadByDoctor = true;
        if (role === "patient")
            update.isReadByPatient = true;
        yield message_1.default.updateMany({ doctorId, patientId }, { $set: update });
        return res.json({ success: true });
    }
    catch (e) {
        return res
            .status(500)
            .json({ message: "Lỗi cập nhật trạng thái đọc", error: e });
    }
}));
// Đếm tin chưa đọc cho role
router.get("/unread-count", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { doctorId, patientId, role } = req.query;
        if (role === "doctor") {
            if (!doctorId)
                return res.status(400).json({ message: "Thiếu doctorId" });
            const count = yield message_1.default.countDocuments({
                doctorId,
                isReadByDoctor: false,
                senderRole: "patient",
            });
            return res.json({ count });
        }
        if (role === "patient") {
            if (!patientId)
                return res.status(400).json({ message: "Thiếu patientId" });
            const count = yield message_1.default.countDocuments({
                patientId,
                isReadByPatient: false,
                senderRole: "doctor",
            });
            return res.json({ count });
        }
        return res.status(400).json({ message: "Thiếu role" });
    }
    catch (e) {
        return res.status(500).json({ message: "Lỗi đếm tin chưa đọc", error: e });
    }
}));
// Lấy bác sĩ gần nhất có nhắn cho bệnh nhân (dựa theo thời gian mới nhất)
router.get("/latest-doctor", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId } = req.query;
        if (!patientId)
            return res.status(400).json({ message: "Thiếu patientId" });
        const latest = yield message_1.default.find({ patientId })
            .sort({ createdAt: -1 })
            .limit(1)
            .lean();
        if (!latest.length)
            return res.json({ doctorId: null });
        return res.json({ doctorId: String(latest[0].doctorId) });
    }
    catch (e) {
        return res
            .status(500)
            .json({ message: "Lỗi lấy bác sĩ gần nhất", error: e });
    }
}));
// Danh sách hội thoại của bác sĩ dựa trên các lịch hẹn với bệnh nhân
router.get("/doctor-threads", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { doctorId } = req.query;
        if (!doctorId)
            return res.status(400).json({ message: "Thiếu doctorId" });
        // Lấy danh sách patient từ Message (những thread đã có tin nhắn)
        const messagePatientIds = yield message_1.default.distinct("patientId", { doctorId });
        // Bổ sung danh sách patient từ Appointment (đã đặt lịch với bác sĩ)
        const appointments = yield Appointment_1.default.find({ doctorId })
            .select("patientId")
            .lean();
        const appointmentPatientIds = appointments.map((a) => String(a.patientId));
        const uniquePatientIds = Array.from(new Set([
            ...messagePatientIds.map((id) => String(id)),
            ...appointmentPatientIds,
        ]));
        const threads = yield Promise.all(uniquePatientIds.map((pid) => __awaiter(void 0, void 0, void 0, function* () {
            const [patient, lastMessage, unreadCount] = yield Promise.all([
                Patient_1.default.findById(pid).select("name email phone avatar").lean(),
                message_1.default.findOne({ doctorId, patientId: pid })
                    .sort({ createdAt: -1 })
                    .lean(),
                message_1.default.countDocuments({
                    doctorId,
                    patientId: pid,
                    senderRole: "patient",
                    isReadByDoctor: false,
                }),
            ]);
            return {
                patientId: pid,
                patient,
                lastMessage,
                lastMessageAt: (lastMessage === null || lastMessage === void 0 ? void 0 : lastMessage.createdAt) || null,
                unreadCount,
            };
        })));
        threads.sort((a, b) => {
            const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return bt - at;
        });
        return res.json(threads);
    }
    catch (e) {
        return res
            .status(500)
            .json({ message: "Lỗi lấy danh sách hội thoại", error: e });
    }
}));
exports.default = router;
