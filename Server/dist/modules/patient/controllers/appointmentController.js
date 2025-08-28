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
exports.updateSymptoms = exports.cancelAppointment = exports.getPatientAppointments = exports.createAppointment = void 0;
const Appointment_1 = __importDefault(require("../models/Appointment"));
const DoctorSchedule_1 = __importDefault(require("../../doctor/models/DoctorSchedule"));
// Patient: Tạo lịch hẹn mới
const createAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId, doctorId, scheduleId, symptoms, note } = req.body;
        if (!patientId || !doctorId || !scheduleId) {
            res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
            return;
        }
        const schedule = yield DoctorSchedule_1.default.findById(scheduleId);
        if (!schedule || String(schedule.doctorId) !== String(doctorId)) {
            res.status(404).json({ message: "Không tìm thấy lịch" });
            return;
        }
        if (schedule.isBooked) {
            res.status(400).json({ message: "Khung giờ đã được đặt" });
            return;
        }
        const appointment = yield Appointment_1.default.create({
            patientId,
            doctorId,
            scheduleId,
            status: "pending",
            symptoms,
            note,
        });
        schedule.isBooked = true;
        yield schedule.save();
        res.status(201).json(appointment);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi tạo lịch hẹn", error });
    }
});
exports.createAppointment = createAppointment;
// Patient: Lấy lịch hẹn của bệnh nhân
const getPatientAppointments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId } = req.query;
        const list = yield Appointment_1.default.find({ patientId })
            .populate("doctorId", "name specialty workplace")
            .populate("scheduleId")
            .sort({ createdAt: -1 })
            .lean();
        res.json(list);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy lịch hẹn", error });
    }
});
exports.getPatientAppointments = getPatientAppointments;
// Patient: Hủy lịch hẹn
const cancelAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { patientId } = req.body;
        const appointment = yield Appointment_1.default.findOne({ _id: id, patientId });
        if (!appointment) {
            res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
            return;
        }
        if (appointment.status === "done") {
            res.status(400).json({ message: "Không thể hủy lịch hẹn đã hoàn thành" });
            return;
        }
        appointment.status = "cancelled";
        yield appointment.save();
        // Cập nhật trạng thái lịch làm việc
        if (appointment.scheduleId) {
            yield DoctorSchedule_1.default.findByIdAndUpdate(appointment.scheduleId, {
                isBooked: false,
            });
        }
        res.json({ message: "Hủy lịch hẹn thành công", appointment });
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi hủy lịch hẹn", error });
    }
});
exports.cancelAppointment = cancelAppointment;
// Patient: Cập nhật triệu chứng
const updateSymptoms = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { patientId, symptoms } = req.body;
        const appointment = yield Appointment_1.default.findOne({ _id: id, patientId });
        if (!appointment) {
            res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
            return;
        }
        if (appointment.status !== "pending") {
            res
                .status(400)
                .json({ message: "Chỉ có thể cập nhật lịch hẹn đang chờ" });
            return;
        }
        appointment.symptoms = symptoms;
        yield appointment.save();
        res.json(appointment);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi cập nhật triệu chứng", error });
    }
});
exports.updateSymptoms = updateSymptoms;
