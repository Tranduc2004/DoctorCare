"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const appointment_1 = require("../../../shared/types/appointment");
const payment_1 = require("../../../shared/constants/payment");
const notificationService_1 = require("../../../shared/services/notificationService");
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
            // include the proposed new schedule so clients can display doctor's suggestion
            .populate({
            path: "newScheduleId",
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
        // support both :id and :appointmentId route param names for robustness
        const appointmentId = req.params.appointmentId || req.params.id || "";
        const { status, doctorId } = req.body;
        // Validate required fields
        if (!appointmentId || !status || !doctorId) {
            res.status(400).json({
                message: "Thiếu thông tin bắt buộc",
                details: {
                    appointmentId: !appointmentId ? "Thiếu ID lịch hẹn" : null,
                    status: !status ? "Thiếu trạng thái mới" : null,
                    doctorId: !doctorId ? "Thiếu ID bác sĩ" : null,
                },
            });
            return;
        }
        // Validate status is a valid enum value
        if (!Object.values(appointment_1.AppointmentStatus).includes(status)) {
            res.status(400).json({
                message: "Trạng thái không hợp lệ",
                validStatuses: Object.values(appointment_1.AppointmentStatus),
            });
            return;
        }
        const appointment = yield Appointment_1.default.findOne({
            _id: appointmentId,
            doctorId,
        });
        if (!appointment) {
            res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
            return;
        }
        // Validate status transition
        const validTransitions = {
            [appointment_1.AppointmentStatus.BOOKED]: [
                appointment_1.AppointmentStatus.DOCTOR_APPROVED,
                appointment_1.AppointmentStatus.DOCTOR_REJECTED,
                appointment_1.AppointmentStatus.CANCELLED,
            ],
            [appointment_1.AppointmentStatus.DOCTOR_APPROVED]: [
                appointment_1.AppointmentStatus.AWAIT_PAYMENT,
                appointment_1.AppointmentStatus.CANCELLED,
            ],
            [appointment_1.AppointmentStatus.AWAIT_PAYMENT]: [
                appointment_1.AppointmentStatus.PAID,
                appointment_1.AppointmentStatus.PAYMENT_OVERDUE,
                appointment_1.AppointmentStatus.CANCELLED,
            ],
            [appointment_1.AppointmentStatus.PAID]: [
                appointment_1.AppointmentStatus.CONFIRMED,
                appointment_1.AppointmentStatus.CANCELLED,
            ],
            [appointment_1.AppointmentStatus.CONFIRMED]: [
                appointment_1.AppointmentStatus.IN_CONSULT,
                appointment_1.AppointmentStatus.CANCELLED,
            ],
            [appointment_1.AppointmentStatus.IN_CONSULT]: [
                appointment_1.AppointmentStatus.PRESCRIPTION_ISSUED,
                appointment_1.AppointmentStatus.CANCELLED,
            ],
            [appointment_1.AppointmentStatus.PRESCRIPTION_ISSUED]: [
                appointment_1.AppointmentStatus.READY_TO_DISCHARGE,
                appointment_1.AppointmentStatus.CANCELLED,
            ],
            [appointment_1.AppointmentStatus.READY_TO_DISCHARGE]: [
                appointment_1.AppointmentStatus.COMPLETED,
                appointment_1.AppointmentStatus.CANCELLED,
            ],
            [appointment_1.AppointmentStatus.COMPLETED]: [],
            [appointment_1.AppointmentStatus.CANCELLED]: [],
            [appointment_1.AppointmentStatus.CLOSED]: [],
            [appointment_1.AppointmentStatus.DOCTOR_REJECTED]: [appointment_1.AppointmentStatus.CLOSED],
            [appointment_1.AppointmentStatus.DOCTOR_RESCHEDULE]: [
                appointment_1.AppointmentStatus.BOOKED,
                appointment_1.AppointmentStatus.CANCELLED,
            ],
            [appointment_1.AppointmentStatus.PAYMENT_OVERDUE]: [appointment_1.AppointmentStatus.CLOSED],
        };
        const currentStatus = appointment.status;
        console.log("Current status:", currentStatus);
        console.log("Requested status:", status);
        // Ensure current status is valid
        if (!Object.values(appointment_1.AppointmentStatus).includes(currentStatus)) {
            res.status(400).json({
                message: "Trạng thái hiện tại không hợp lệ",
                currentStatus,
                validStatuses: Object.values(appointment_1.AppointmentStatus),
            });
            return;
        }
        const allowedNextStatuses = validTransitions[currentStatus];
        if (!allowedNextStatuses) {
            console.error("No transitions defined for status:", currentStatus);
            res.status(400).json({
                message: `Không có quy tắc chuyển trạng thái cho ${currentStatus}`,
                currentStatus,
                requestedStatus: status,
            });
            return;
        }
        if (!allowedNextStatuses.includes(status)) {
            res.status(400).json({
                message: `Không thể chuyển từ trạng thái ${currentStatus} sang ${status}`,
                currentStatus,
                requestedStatus: status,
                allowedTransitions: allowedNextStatuses,
            });
            return;
        }
        // Update the appointment
        appointment.status = status;
        try {
            yield appointment.save();
            // Tự động tạo hóa đơn tạm ứng khi bác sĩ chấp nhận
            if (status === appointment_1.AppointmentStatus.DOCTOR_APPROVED) {
                const Doctor = yield Promise.resolve().then(() => __importStar(require("../models/Doctor"))).then((m) => m.default);
                const doctor = yield Doctor.findById(doctorId);
                if (!doctor) {
                    throw new Error("Không tìm thấy thông tin bác sĩ");
                }
                // Tạo hóa đơn tạm ứng
                const Invoice = yield Promise.resolve().then(() => __importStar(require("../../patient/models/Invoice"))).then((m) => m.default);
                yield Invoice.create({
                    appointmentId: appointment._id,
                    type: "consultation",
                    items: [
                        {
                            type: "consultation_fee",
                            description: "Phí khám cơ bản",
                            amount: doctor.consultationFee || 0,
                            insuranceCoverage: "no_coverage",
                            insuranceAmount: 0,
                            patientAmount: doctor.consultationFee || 0,
                        },
                    ],
                    subtotal: doctor.consultationFee || 0,
                    insuranceCoverage: 0,
                    patientAmount: doctor.consultationFee || 0,
                    status: "pending",
                    dueDate: new Date(Date.now() + payment_1.PAYMENT_HOLD_MS), // payment hold duration
                });
                // Cập nhật trạng thái appointment sang AWAIT_PAYMENT
                appointment.status = appointment_1.AppointmentStatus.AWAIT_PAYMENT;
                yield appointment.save();
            }
        }
        catch (saveError) {
            console.error("Error saving appointment:", saveError);
            res.status(500).json({
                message: "Lỗi khi lưu cập nhật trạng thái",
                error: saveError instanceof Error ? saveError.message : String(saveError),
            });
            return;
        }
        // Free the slot when appointment gets cancelled
        if ((status === appointment_1.AppointmentStatus.CANCELLED ||
            status === appointment_1.AppointmentStatus.PAYMENT_OVERDUE) &&
            appointment.scheduleId) {
            try {
                const DoctorSchedule = yield Promise.resolve().then(() => __importStar(require("../models/DoctorSchedule"))).then((m) => m.default);
                yield DoctorSchedule.findByIdAndUpdate(appointment.scheduleId, {
                    isBooked: false,
                });
            }
            catch (scheduleError) {
                console.error("Error updating schedule:", scheduleError);
                // Don't fail the request if this fails, just log it
            }
        }
        // Notify patient (best-effort, non-blocking) about status changes
        try {
            const patientId = String(appointment.patientId);
            if (status === appointment_1.AppointmentStatus.DOCTOR_APPROVED) {
                yield (0, notificationService_1.createNotification)({
                    userId: patientId,
                    type: "appointment",
                    title: "Bác sĩ đã xác nhận lịch hẹn",
                    body: `Lịch hẹn của bạn đã được bác sĩ xác nhận.`,
                });
            }
            else if (status === appointment_1.AppointmentStatus.DOCTOR_REJECTED) {
                yield (0, notificationService_1.createNotification)({
                    userId: patientId,
                    type: "appointment",
                    title: "Lịch hẹn bị từ chối",
                    body: `Bác sĩ đã từ chối lịch hẹn của bạn. Vui lòng kiểm tra chi tiết hoặc đặt lại lịch.`,
                });
            }
            else if (status === appointment_1.AppointmentStatus.CANCELLED) {
                yield (0, notificationService_1.createNotification)({
                    userId: patientId,
                    type: "appointment",
                    title: "Lịch hẹn đã bị hủy",
                    body: `Lịch hẹn của bạn đã bị hủy. Nếu có thắc mắc, liên hệ phòng khám.`,
                });
            }
            else if (status === appointment_1.AppointmentStatus.AWAIT_PAYMENT) {
                yield (0, notificationService_1.createNotification)({
                    userId: patientId,
                    type: "payment",
                    title: "Yêu cầu thanh toán",
                    body: `Vui lòng hoàn tất thanh toán để xác nhận lịch hẹn.`,
                });
            }
            else if (status === appointment_1.AppointmentStatus.CONFIRMED) {
                yield (0, notificationService_1.createNotification)({
                    userId: patientId,
                    type: "appointment",
                    title: "Lịch hẹn đã được xác nhận",
                    body: `Bác sĩ đã xác nhận và lịch hẹn sẵn sàng.`,
                });
            }
            else if (status === appointment_1.AppointmentStatus.IN_CONSULT) {
                yield (0, notificationService_1.createNotification)({
                    userId: patientId,
                    type: "appointment",
                    title: "Bắt đầu khám",
                    body: `Bác sĩ đã bắt đầu buổi khám của bạn.`,
                });
            }
            else if (status === appointment_1.AppointmentStatus.PRESCRIPTION_ISSUED) {
                yield (0, notificationService_1.createNotification)({
                    userId: patientId,
                    type: "appointment",
                    title: "Kê đơn/Hoàn tất khám",
                    body: `Bác sĩ đã hoàn tất khám và kê đơn cho bạn. Vui lòng kiểm tra chi tiết.`,
                });
            }
        }
        catch (notifyErr) {
            console.error("Notify patient about status change failed:", notifyErr);
        }
        res.json(appointment);
    }
    catch (error) {
        console.error("Error in updateAppointmentStatus:", error);
        res.status(500).json({
            message: "Lỗi cập nhật lịch hẹn",
            error: error instanceof Error ? error.message : String(error),
        });
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
        // Tìm tất cả appointments của doctor
        const appointments = yield Appointment_1.default.find({ doctorId })
            .populate("patientId", "name email phone avatar")
            .populate("scheduleId")
            .lean();
        // Filter appointments theo ngày
        const filteredAppointments = appointments.filter((apt) => {
            if (!apt.scheduleId) {
                return false;
            }
            const schedule = apt.scheduleId;
            const scheduleDate = schedule === null || schedule === void 0 ? void 0 : schedule.date;
            return scheduleDate === date;
        });
        // Sort theo thời gian
        const sortedAppointments = filteredAppointments.sort((a, b) => {
            var _a, _b;
            const aTime = ((_a = a.scheduleId) === null || _a === void 0 ? void 0 : _a.startTime) || "";
            const bTime = ((_b = b.scheduleId) === null || _b === void 0 ? void 0 : _b.startTime) || "";
            return aTime.localeCompare(bTime);
        });
        res.json({
            success: true,
            data: sortedAppointments,
            count: sortedAppointments.length
        });
    }
    catch (error) {
        console.error("Error in getAppointmentsByDate:", error);
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
        // Treat awaiting-payment holds as pending as well
        const pending = yield Appointment_1.default.countDocuments({
            doctorId,
            status: {
                $in: [appointment_1.AppointmentStatus.BOOKED, appointment_1.AppointmentStatus.AWAIT_PAYMENT],
            },
        });
        const confirmed = yield Appointment_1.default.countDocuments({
            doctorId,
            status: appointment_1.AppointmentStatus.CONFIRMED,
        });
        const examining = yield Appointment_1.default.countDocuments({
            doctorId,
            status: appointment_1.AppointmentStatus.IN_CONSULT,
        });
        const prescribing = yield Appointment_1.default.countDocuments({
            doctorId,
            status: appointment_1.AppointmentStatus.PRESCRIPTION_ISSUED,
        });
        const completed = yield Appointment_1.default.countDocuments({
            doctorId,
            status: appointment_1.AppointmentStatus.COMPLETED,
        });
        const cancelled = yield Appointment_1.default.countDocuments({
            doctorId,
            status: appointment_1.AppointmentStatus.CANCELLED,
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
