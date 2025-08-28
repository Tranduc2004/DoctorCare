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
exports.getAppointmentStats = exports.getAppointmentsByDate = exports.updateAppointmentStatus = exports.getDoctorAppointments = void 0;
const Appointment_1 = __importDefault(require("../../patient/models/Appointment"));
// Doctor: Lấy lịch hẹn của bác sĩ
const getDoctorAppointments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { doctorId } = req.query;
        const list = yield Appointment_1.default.find({ doctorId })
            .populate("patientId", "name email phone")
            .populate("scheduleId")
            .sort({ createdAt: -1 })
            .lean();
        res.json(list);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy lịch hẹn của bác sĩ", error });
    }
});
exports.getDoctorAppointments = getDoctorAppointments;
// Doctor: Cập nhật trạng thái lịch hẹn
const updateAppointmentStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status, doctorId } = req.body;
        const appointment = yield Appointment_1.default.findOne({ _id: id, doctorId });
        if (!appointment) {
            res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
            return;
        }
        appointment.status = status;
        yield appointment.save();
        res.json(appointment);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi cập nhật lịch hẹn", error });
    }
});
exports.updateAppointmentStatus = updateAppointmentStatus;
// Doctor: Lấy lịch hẹn theo ngày
const getAppointmentsByDate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { doctorId, date } = req.query;
        if (!doctorId || !date) {
            res.status(400).json({ message: "Thiếu doctorId hoặc date" });
            return;
        }
        const appointments = yield Appointment_1.default.find({ doctorId })
            .populate("patientId", "name email phone")
            .populate("scheduleId")
            .populate({
            path: "scheduleId",
            match: { date: date },
        })
            .lean()
            .then((appointments) => appointments.filter((apt) => apt.scheduleId))
            .then((appointments) => appointments.sort((a, b) => {
            var _a, _b;
            const aTime = ((_a = a.scheduleId) === null || _a === void 0 ? void 0 : _a.startTime) || "";
            const bTime = ((_b = b.scheduleId) === null || _b === void 0 ? void 0 : _b.startTime) || "";
            return aTime.localeCompare(bTime);
        }));
        res.json(appointments);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy lịch hẹn theo ngày", error });
    }
});
exports.getAppointmentsByDate = getAppointmentsByDate;
// Doctor: Lấy thống kê lịch hẹn
const getAppointmentStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { doctorId } = req.query;
        if (!doctorId) {
            res.status(400).json({ message: "Thiếu doctorId" });
            return;
        }
        const total = yield Appointment_1.default.countDocuments({ doctorId });
        const pending = yield Appointment_1.default.countDocuments({
            doctorId,
            status: "pending",
        });
        const confirmed = yield Appointment_1.default.countDocuments({
            doctorId,
            status: "confirmed",
        });
        const completed = yield Appointment_1.default.countDocuments({
            doctorId,
            status: "done",
        });
        const cancelled = yield Appointment_1.default.countDocuments({
            doctorId,
            status: "cancelled",
        });
        res.json({
            total,
            pending,
            confirmed,
            completed,
            cancelled,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy thống kê lịch hẹn", error });
    }
});
exports.getAppointmentStats = getAppointmentStats;
