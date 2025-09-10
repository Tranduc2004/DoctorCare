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
console.log("Appointment model imported successfully");
// Doctor: Lấy lịch hẹn của bác sĩ
const getDoctorAppointments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { doctorId } = req.query;
        if (!doctorId) {
            res.status(400).json({ message: "Thiếu doctorId" });
            return;
        }
        console.log("Fetching appointments for doctorId:", doctorId);
        // Check if there are any appointments at all
        const allAppointments = yield Appointment_1.default.find({}).lean();
        console.log("Total appointments in database:", allAppointments.length);
        // First, try without populate to see if basic query works
        const basicList = yield Appointment_1.default.find({ doctorId }).lean();
        console.log("Basic appointments found for doctorId:", basicList.length);
        // Then try with populate
        const list = yield Appointment_1.default.find({ doctorId })
            .populate({
            path: "patientId",
            select: "name email phone",
            model: "Patient",
        })
            .populate({
            path: "scheduleId",
            model: "DoctorSchedule",
        })
            .sort({ createdAt: -1 })
            .lean();
        console.log("Found appointments with populate:", list.length);
        // Return the populated data
        res.json(list);
    }
    catch (error) {
        console.error("Error in getDoctorAppointments:", error);
        res.status(500).json({
            message: "Lỗi lấy lịch hẹn của bác sĩ",
            error: error instanceof Error ? error.message : String(error),
        });
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
        // Validate status transition
        const validTransitions = {
            pending: ["confirmed", "cancelled"],
            confirmed: ["examining", "cancelled"],
            examining: ["prescribing", "cancelled"],
            prescribing: ["done", "cancelled"],
            done: [],
            cancelled: [],
        };
        const currentStatus = appointment.status;
        const allowedNextStatuses = validTransitions[currentStatus];
        if (!allowedNextStatuses.includes(status)) {
            res.status(400).json({
                message: `Không thể chuyển từ trạng thái ${currentStatus} sang ${status}`,
                allowedTransitions: allowedNextStatuses,
            });
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
        const examining = yield Appointment_1.default.countDocuments({
            doctorId,
            status: "examining",
        });
        const prescribing = yield Appointment_1.default.countDocuments({
            doctorId,
            status: "prescribing",
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
            examining,
            prescribing,
            completed,
            cancelled,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy thống kê lịch hẹn", error });
    }
});
exports.getAppointmentStats = getAppointmentStats;
