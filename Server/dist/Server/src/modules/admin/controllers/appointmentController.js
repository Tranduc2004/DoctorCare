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
exports.getAppointmentStats = exports.deleteAppointment = exports.updateAppointmentStatus = exports.getAllAppointments = void 0;
const Appointment_1 = __importDefault(require("../../patient/models/Appointment"));
const DoctorSchedule_1 = __importDefault(require("../../doctor/models/DoctorSchedule"));
// Admin: Lấy tất cả lịch hẹn trong hệ thống
const getAllAppointments = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const appointments = yield Appointment_1.default.find()
            .populate("patientId", "name email phone")
            .populate("doctorId", "name specialty workplace")
            .populate("scheduleId")
            .sort({ createdAt: -1 })
            .lean();
        res.json(appointments);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy danh sách lịch hẹn", error });
    }
});
exports.getAllAppointments = getAllAppointments;
// Admin: Cập nhật trạng thái lịch hẹn
const updateAppointmentStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const appointment = yield Appointment_1.default.findByIdAndUpdate(id, { status }, { new: true });
        if (!appointment) {
            res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
            return;
        }
        res.json(appointment);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi cập nhật lịch hẹn", error });
    }
});
exports.updateAppointmentStatus = updateAppointmentStatus;
// Admin: Xóa lịch hẹn
const deleteAppointment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const appointment = yield Appointment_1.default.findByIdAndDelete(id);
        if (!appointment) {
            res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
            return;
        }
        // Cập nhật trạng thái lịch làm việc
        if (appointment.scheduleId) {
            yield DoctorSchedule_1.default.findByIdAndUpdate(appointment.scheduleId, {
                isBooked: false,
            });
        }
        res.json({ message: "Xóa lịch hẹn thành công" });
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi xóa lịch hẹn", error });
    }
});
exports.deleteAppointment = deleteAppointment;
// Admin: Thống kê lịch hẹn
const getAppointmentStats = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const total = yield Appointment_1.default.countDocuments();
        const pending = yield Appointment_1.default.countDocuments({ status: "pending" });
        const confirmed = yield Appointment_1.default.countDocuments({ status: "confirmed" });
        const completed = yield Appointment_1.default.countDocuments({ status: "done" });
        const cancelled = yield Appointment_1.default.countDocuments({ status: "cancelled" });
        res.json({
            total,
            pending,
            confirmed,
            completed,
            cancelled,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy thống kê", error });
    }
});
exports.getAppointmentStats = getAppointmentStats;
