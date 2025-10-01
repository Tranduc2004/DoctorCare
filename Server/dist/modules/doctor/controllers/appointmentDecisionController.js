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
exports.completeConsultation = exports.startConsultation = exports.acceptReschedule = exports.rejectAppointment = exports.requestReschedule = exports.approveAppointment = void 0;
const Appointment_1 = __importDefault(require("../../patient/models/Appointment"));
const DoctorSchedule_1 = __importDefault(require("../models/DoctorSchedule"));
const Invoice_1 = __importDefault(require("../../patient/models/Invoice"));
const computePricing_1 = require("../../pricing/services/computePricing");
const appointment_1 = require("../../../shared/types/appointment");
const payment_1 = require("../../../shared/constants/payment");
const notificationService_1 = require("../../../shared/services/notificationService");
const Encounter_1 = __importDefault(require("../../encounter/models/Encounter"));
// Doctor approves appointment
const approveAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { appointmentId } = req.params;
        const { doctorId, consultationFee, depositAmount, insuranceCoverage, notes, } = req.body;
        // Try to find the appointment for this doctor. Historically we required
        // the appointment to be in BOOKED state, but some UI flows may have moved
        // it to AWAIT_PAYMENT earlier. To ensure we still create invoices when
        // the doctor confirms, find by id+doctor and allow continuing while
        // preserving the previous 404 behaviour when no appointment exists.
        let appointment = yield Appointment_1.default.findOne({
            _id: appointmentId,
            doctorId,
        });
        if (!appointment) {
            return res
                .status(404)
                .json({ message: "Không tìm thấy lịch hẹn chờ xác nhận" });
        }
        // If the appointment exists but is not in BOOKED state, log a note and
        // continue — this increases robustness when the client updated status
        // before the doctor action and avoids silently skipping invoice creation.
        if (appointment.status !== appointment_1.AppointmentStatus.BOOKED) {
            console.warn(`approveAppointment: appointment ${appointmentId} has status ${appointment.status} (expected BOOKED). Proceeding with approval to ensure invoice creation.`);
        }
        // Update appointment
        appointment.status = appointment_1.AppointmentStatus.DOCTOR_APPROVED;
        appointment.doctorDecision = "approved";
        appointment.doctorNotes = notes;
        appointment.consultationFee = consultationFee || 0;
        appointment.depositAmount = depositAmount || 0;
        appointment.insuranceCoverage = insuranceCoverage || 0;
        yield appointment.save();
        // After saving appointment, attempt to create a consultation invoice (idempotent)
        try {
            const existing = yield Invoice_1.default.findOne({
                appointmentId,
                type: "consultation",
                status: "pending",
            });
            if (!existing) {
                // If clinic/doctor provided explicit fee, use it; otherwise try compute
                let createdInvoice = null;
                const fee = Number(consultationFee !== null && consultationFee !== void 0 ? consultationFee : 0);
                const deposit = Number(depositAmount !== null && depositAmount !== void 0 ? depositAmount : 0);
                if (fee > 0 || deposit > 0) {
                    createdInvoice = yield Invoice_1.default.create({
                        appointmentId,
                        type: "consultation",
                        items: [
                            ...(fee > 0
                                ? [
                                    {
                                        type: "consultation_fee",
                                        description: "Phí khám cơ bản",
                                        amount: fee,
                                        insuranceAmount: 0,
                                        patientAmount: fee,
                                    },
                                ]
                                : []),
                            ...(deposit > 0
                                ? [
                                    {
                                        type: "deposit",
                                        description: "Đặt cọc giữ chỗ",
                                        amount: deposit,
                                        insuranceAmount: 0,
                                        patientAmount: deposit,
                                    },
                                ]
                                : []),
                        ],
                        subtotal: (fee || 0) + (deposit || 0),
                        insuranceCoverage: 0,
                        patientAmount: (fee || 0) + (deposit || 0),
                        dueDate: new Date(Date.now() + payment_1.PAYMENT_HOLD_MS),
                    });
                }
                else {
                    // attempt compute from service
                    const parseService = (note) => {
                        var _a;
                        if (!note)
                            return "";
                        const m = note.match(/\[Dịch vụ\]\s*([^|\n]+)/);
                        return ((_a = m === null || m === void 0 ? void 0 : m[1]) === null || _a === void 0 ? void 0 : _a.trim()) || "";
                    };
                    const serviceCode = parseService(appointment.note) || "";
                    const durationMin = 45;
                    const startAt = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}:00`).toISOString();
                    const resolveDoctorIdLocal = (d) => {
                        if (!d)
                            return undefined;
                        if (typeof d === "string")
                            return /^[0-9a-fA-F]{24}$/.test(d) ? d : undefined;
                        if (typeof d === "object") {
                            if (d === null || d === void 0 ? void 0 : d._id)
                                return String(d._id);
                            try {
                                const s = String(d);
                                if (/^[0-9a-fA-F]{24}$/.test(s))
                                    return s;
                            }
                            catch (_a) { }
                        }
                        return undefined;
                    };
                    const computed = yield (0, computePricing_1.computeConsultPrice)({
                        serviceCode,
                        doctorId: resolveDoctorIdLocal(doctorId) ||
                            resolveDoctorIdLocal(appointment.doctorId),
                        durationMin,
                        startAt,
                        bhytEligible: (appointment.insuranceCoverage || 0) > 0,
                        copayRate: (appointment.insuranceCoverage || 0) / 100,
                    });
                    const mapped = computed.items.map((it) => ({
                        type: it.component === "facility"
                            ? "consultation_fee"
                            : "additional_services",
                        description: it.description,
                        amount: it.amount,
                        insuranceAmount: it.insuranceAmount || 0,
                        patientAmount: it.patientAmount || 0,
                    }));
                    createdInvoice = yield Invoice_1.default.create({
                        appointmentId,
                        type: "consultation",
                        items: mapped,
                        subtotal: computed.totals.total,
                        insuranceCoverage: computed.totals.bhyt,
                        patientAmount: computed.totals.patient,
                        dueDate: new Date(Date.now() + payment_1.PAYMENT_HOLD_MS),
                    });
                }
                if (createdInvoice) {
                    // update appointment payment totals
                    appointment.status = appointment_1.AppointmentStatus.AWAIT_PAYMENT;
                    appointment.totalAmount = createdInvoice.subtotal;
                    appointment.patientAmount = createdInvoice.patientAmount;
                    appointment.paymentStatus = appointment_1.PaymentStatus.PENDING;
                    yield appointment.save();
                }
            }
        }
        catch (err) {
            console.error("Auto-create invoice failed:", err);
            // don't block the approve flow on invoice errors
        }
        // Notify patient about the doctor's approval and any invoice created
        try {
            yield (0, notificationService_1.createNotification)({
                userId: String(appointment.patientId),
                type: "appointment",
                title: "Bác sĩ đã xác nhận lịch hẹn",
                body: `Lịch hẹn của bạn đã được bác sĩ xác nhận. Trạng thái: ${appointment.status}`,
            });
        }
        catch (err) {
            console.error("Notify patient about approval failed:", err);
        }
        res.json({
            message: "Đã chấp nhận lịch hẹn",
            appointment,
            nextStep: "Tạo hóa đơn tạm ứng để bệnh nhân thanh toán",
        });
    }
    catch (error) {
        const err = error;
        console.error("Error approving appointment:", err);
        res
            .status(500)
            .json({ message: "Lỗi chấp nhận lịch hẹn", error: err.message });
    }
});
exports.approveAppointment = approveAppointment;
// Doctor requests reschedule
const requestReschedule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { appointmentId } = req.params;
        const { doctorId, newScheduleId, reason, notes } = req.body;
        const appointment = yield Appointment_1.default.findOne({
            _id: appointmentId,
            doctorId,
            status: appointment_1.AppointmentStatus.BOOKED,
        });
        if (!appointment) {
            return res
                .status(404)
                .json({ message: "Không tìm thấy lịch hẹn chờ xác nhận" });
        }
        // Check if new schedule exists and is available
        const newSchedule = yield DoctorSchedule_1.default.findOne({
            _id: newScheduleId,
            doctorId,
            status: "accepted",
            isBooked: false,
        });
        if (!newSchedule) {
            return res
                .status(400)
                .json({ message: "Khung giờ mới không hợp lệ hoặc đã được đặt" });
        }
        // Update appointment
        appointment.status = appointment_1.AppointmentStatus.DOCTOR_RESCHEDULE;
        appointment.doctorDecision = "reschedule";
        appointment.rescheduleReason = reason;
        appointment.doctorNotes = notes;
        appointment.newScheduleId = newScheduleId;
        yield appointment.save();
        // Notify patient about reschedule request
        try {
            yield (0, notificationService_1.createNotification)({
                userId: String(appointment.patientId),
                type: "appointment",
                title: "Bác sĩ đề nghị dời lịch",
                body: `Bác sĩ đề nghị dời lịch: ${reason || ""}`,
            });
        }
        catch (err) {
            console.error("Notify patient about reschedule failed:", err);
        }
        res.json({
            message: "Đã yêu cầu dời lịch",
            appointment,
            newSchedule,
            nextStep: "Chờ bệnh nhân xác nhận lịch mới",
        });
    }
    catch (error) {
        const err = error;
        console.error("Error requesting reschedule:", err);
        res
            .status(500)
            .json({ message: "Lỗi yêu cầu dời lịch", error: err.message });
    }
});
exports.requestReschedule = requestReschedule;
// Doctor rejects appointment
const rejectAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { appointmentId } = req.params;
        const { doctorId, reason, notes } = req.body;
        const appointment = yield Appointment_1.default.findOne({
            _id: appointmentId,
            doctorId,
            status: appointment_1.AppointmentStatus.BOOKED,
        });
        if (!appointment) {
            return res
                .status(404)
                .json({ message: "Không tìm thấy lịch hẹn chờ xác nhận" });
        }
        // Update appointment
        appointment.status = appointment_1.AppointmentStatus.DOCTOR_REJECTED;
        appointment.doctorDecision = "rejected";
        appointment.rejectionReason = reason;
        appointment.doctorNotes = notes;
        appointment.cancelledAt = new Date();
        appointment.cancelledBy = "doctor";
        appointment.cancellationReason = reason;
        yield appointment.save();
        // Free up the schedule
        const schedule = yield DoctorSchedule_1.default.findById(appointment.scheduleId);
        if (schedule) {
            schedule.isBooked = false;
            yield schedule.save();
        }
        res.json({
            message: "Đã từ chối lịch hẹn",
            appointment,
            nextStep: "Nếu đã thanh toán, cần hoàn tiền cho bệnh nhân",
        });
        // Notify patient about rejection
        try {
            yield (0, notificationService_1.createNotification)({
                userId: String(appointment.patientId),
                type: "appointment",
                title: "Lịch hẹn bị từ chối",
                body: `Lịch hẹn của bạn đã bị bác sĩ từ chối. Lý do: ${reason || ""}`,
            });
        }
        catch (err) {
            console.error("Notify patient about rejection failed:", err);
        }
    }
    catch (error) {
        const err = error;
        console.error("Error rejecting appointment:", err);
        res
            .status(500)
            .json({ message: "Lỗi từ chối lịch hẹn", error: err.message });
    }
});
exports.rejectAppointment = rejectAppointment;
// Patient accepts reschedule
const acceptReschedule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { appointmentId } = req.params;
        const { patientId } = req.body;
        const appointment = yield Appointment_1.default.findOne({
            _id: appointmentId,
            patientId,
            status: appointment_1.AppointmentStatus.DOCTOR_RESCHEDULE,
        });
        if (!appointment) {
            return res
                .status(404)
                .json({ message: "Không tìm thấy lịch hẹn chờ dời" });
        }
        if (!appointment.newScheduleId) {
            return res.status(400).json({ message: "Không có lịch mới để chuyển" });
        }
        // Free up old schedule
        const oldSchedule = yield DoctorSchedule_1.default.findById(appointment.scheduleId);
        if (oldSchedule) {
            oldSchedule.isBooked = false;
            yield oldSchedule.save();
        }
        // Book new schedule
        const newSchedule = yield DoctorSchedule_1.default.findById(appointment.newScheduleId);
        if (newSchedule) {
            newSchedule.isBooked = true;
            yield newSchedule.save();
        }
        // Update appointment
        appointment.scheduleId = appointment.newScheduleId;
        appointment.appointmentDate =
            (newSchedule === null || newSchedule === void 0 ? void 0 : newSchedule.date) || appointment.appointmentDate;
        appointment.appointmentTime =
            (newSchedule === null || newSchedule === void 0 ? void 0 : newSchedule.startTime) || appointment.appointmentTime;
        appointment.status = appointment_1.AppointmentStatus.BOOKED; // Back to booked, waiting for approval
        appointment.doctorDecision = undefined;
        appointment.rescheduleReason = undefined;
        appointment.newScheduleId = undefined;
        yield appointment.save();
        res.json({
            message: "Đã chấp nhận lịch mới",
            appointment,
            nextStep: "Chờ bác sĩ xác nhận lại lịch mới",
        });
        // Notify doctor that patient accepted reschedule (could notify both)
        try {
            yield (0, notificationService_1.createNotification)({
                userId: String(appointment.doctorId),
                type: "appointment",
                title: "Bệnh nhân đã chấp nhận dời lịch",
                body: `Bệnh nhân đã chấp nhận lịch mới`,
            });
        }
        catch (err) {
            console.error("Notify doctor about reschedule acceptance failed:", err);
        }
    }
    catch (error) {
        const err = error;
        console.error("Error accepting reschedule:", err);
        res
            .status(500)
            .json({ message: "Lỗi chấp nhận lịch mới", error: err.message });
    }
});
exports.acceptReschedule = acceptReschedule;
// Start consultation
const startConsultation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { appointmentId } = req.params;
        const { doctorId } = req.body;
        const appointment = yield Appointment_1.default.findOne({
            _id: appointmentId,
            doctorId,
            status: appointment_1.AppointmentStatus.CONFIRMED,
        });
        if (!appointment) {
            return res
                .status(404)
                .json({ message: "Không tìm thấy lịch hẹn đã xác nhận" });
        }
        // Update appointment
        appointment.status = appointment_1.AppointmentStatus.IN_CONSULT;
        appointment.startedAt = new Date();
        yield appointment.save();
        // Create Encounter record linked to this appointment
        try {
            const enc = yield Encounter_1.default.create({
                appointmentId: appointment._id,
                patientId: appointment.patientId,
                doctorId: appointment.doctorId,
                status: "in_consult",
                startedAt: new Date(),
            });
            // attach encounter id to response for client convenience
            appointment._encounter = enc;
        }
        catch (err) {
            console.error("Failed to create Encounter for appointment", appointmentId, err);
            // don't fail the startConsultation flow if encounter creation fails
        }
        res.json({
            message: "Đã bắt đầu khám",
            appointment,
        });
        try {
            yield (0, notificationService_1.createNotification)({
                userId: String(appointment.patientId),
                type: "appointment",
                title: "Bắt đầu khám",
                body: `Bác sĩ đã bắt đầu buổi khám của bạn`,
            });
        }
        catch (err) {
            console.error("Notify patient about startConsultation failed:", err);
        }
    }
    catch (error) {
        const err = error;
        console.error("Error starting consultation:", err);
        res.status(500).json({ message: "Lỗi bắt đầu khám", error: err.message });
    }
});
exports.startConsultation = startConsultation;
// Complete consultation
const completeConsultation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { appointmentId } = req.params;
        const { doctorId, diagnosis, prescription, additionalServices } = req.body;
        const appointment = yield Appointment_1.default.findOne({
            _id: appointmentId,
            doctorId,
            status: appointment_1.AppointmentStatus.IN_CONSULT,
        });
        if (!appointment) {
            return res
                .status(404)
                .json({ message: "Không tìm thấy lịch hẹn đang khám" });
        }
        // Update appointment
        appointment.diagnosis = diagnosis;
        appointment.prescription = prescription;
        appointment.additionalServices = additionalServices || [];
        appointment.status = appointment_1.AppointmentStatus.PRESCRIPTION_ISSUED;
        yield appointment.save();
        res.json({
            message: "Đã hoàn tất khám",
            appointment,
            nextStep: "Tạo hóa đơn quyết toán cho các dịch vụ bổ sung",
        });
        try {
            yield (0, notificationService_1.createNotification)({
                userId: String(appointment.patientId),
                type: "appointment",
                title: "Khám hoàn tất",
                body: `Buổi khám đã hoàn tất. Vui lòng xem kết quả và hoá đơn.`,
            });
        }
        catch (err) {
            console.error("Notify patient about completeConsultation failed:", err);
        }
    }
    catch (error) {
        const err = error;
        console.error("Error completing consultation:", err);
        res.status(500).json({ message: "Lỗi hoàn tất khám", error: err.message });
    }
});
exports.completeConsultation = completeConsultation;
