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
exports.rescheduleAccept = exports.reschedulePropose = exports.checkinAppointment = exports.extensionConsent = exports.extendAppointment = exports.updateSymptoms = exports.cancelAppointment = exports.getAppointmentHistory = exports.getPatientAppointments = exports.createAppointment = void 0;
const Appointment_1 = __importDefault(require("../models/Appointment"));
const notificationService_1 = require("../../../shared/services/notificationService");
const DoctorSchedule_1 = __importDefault(require("../../doctor/models/DoctorSchedule"));
const appointment_1 = require("../../../shared/types/appointment");
const payment_1 = require("../../../shared/constants/payment");
const mongoose_1 = __importDefault(require("mongoose"));
// Patient: Tạo lịch hẹn mới
const createAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { patientId, doctorId, scheduleId, symptoms, note, serviceType, appointmentTime, mode, patientInfo, } = req.body;
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
        // Enforce: one appointment per patient per clinic-local day
        // Requirement: only count PENDING / CONFIRMED appointments as blocking new bookings.
        // Mapping: pending -> AppointmentStatus.AWAIT_PAYMENT, confirmed -> AppointmentStatus.BOOKED/CONFIRMED.
        // We expect `schedule.date` to be the clinic-local date in YYYY-MM-DD format (normalized to clinic TZ).
        const appointmentDate = schedule.date; // YYYY-MM-DD (clinic local)
        // Block if patient already has an appointment that is pending (awaiting payment)
        // or already confirmed/booked for the same clinic-local date.
        const blockingStatuses = [
            appointment_1.AppointmentStatus.AWAIT_PAYMENT,
            // include both BOOKED and CONFIRMED if your flow uses either
            appointment_1.AppointmentStatus.BOOKED,
            appointment_1.AppointmentStatus.CONFIRMED,
        ].filter(Boolean);
        const existing = yield Appointment_1.default.findOne({
            patientId,
            appointmentDate,
            status: { $in: blockingStatuses },
        });
        if (existing) {
            res.status(400).json({
                message: "Mỗi bệnh nhân chỉ được 1 lịch mỗi ngày (chờ thanh toán hoặc đã xác nhận).",
            });
            return;
        }
        // Note: do not block booking based on prior failed payments here.
        // Allow patients to retry booking if previous payment attempts failed.
        // Optional: one per specialty/day (if doctor has specialty)
        // We check other appointments this day whose doctor shares same specialty
        // Note: best-effort to avoid extra joins if model differs
        const Doctor = require("../../doctor/models/Doctor").default;
        let specId;
        try {
            const doc = yield Doctor.findById(doctorId).select("specialty").lean();
            const anySpec = (_c = (_b = (_a = doc === null || doc === void 0 ? void 0 : doc.specialty) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : doc === null || doc === void 0 ? void 0 : doc.specialty;
            if (anySpec)
                specId = String(anySpec);
        }
        catch (_d) { }
        if (specId) {
            const sameDayAppointments = yield Appointment_1.default.find({
                patientId,
                status: { $ne: "cancelled" },
            })
                .populate({ path: "scheduleId", select: "date" })
                .populate({ path: "doctorId", select: "specialty" })
                .lean();
            const hasSameSpecSameDay = (sameDayAppointments || []).some((a) => {
                var _a, _b, _c, _d, _e, _f;
                const d = (_a = a.scheduleId) === null || _a === void 0 ? void 0 : _a.date;
                const sp = (_e = (_d = (_c = (_b = a.doctorId) === null || _b === void 0 ? void 0 : _b.specialty) === null || _c === void 0 ? void 0 : _c.toString) === null || _d === void 0 ? void 0 : _d.call(_c)) !== null && _e !== void 0 ? _e : (_f = a.doctorId) === null || _f === void 0 ? void 0 : _f.specialty;
                return d === appointmentDate && sp && specId && sp === specId;
            });
            if (hasSameSpecSameDay) {
                res
                    .status(400)
                    .json({ message: "Mỗi ngày tối đa 1 lịch cho mỗi chuyên khoa" });
                return;
            }
        }
        // Create appointment as a temporary hold awaiting payment.
        // Use AWAIT_PAYMENT as the hold status and set a hold expiry PAYMENT_HOLD_MS from now.
        const holdExpiresAt = new Date(Date.now() + payment_1.PAYMENT_HOLD_MS);
        const appointment = yield Appointment_1.default.create({
            patientId,
            doctorId,
            scheduleId,
            serviceType,
            status: appointment_1.AppointmentStatus.AWAIT_PAYMENT,
            holdExpiresAt,
            mode: mode === "online" ? "online" : "offline",
            symptoms,
            note,
            appointmentTime: appointmentTime || schedule.startTime,
            appointmentDate: schedule.date,
            patientInfo: patientInfo || undefined,
        });
        schedule.isBooked = true;
        yield schedule.save();
        // Notify patient and doctor about the new booking (best-effort)
        try {
            yield (0, notificationService_1.createNotification)({
                userId: String(patientId),
                type: "appointment",
                title: "Đặt lịch thành công",
                body: `Bạn đã đặt lịch với bác sĩ. Ngày ${schedule.date} - ${appointment.appointmentTime}`,
            });
        }
        catch (err) {
            console.error("Notify patient about booking failed:", err);
        }
        try {
            yield (0, notificationService_1.createNotification)({
                userId: String(doctorId),
                type: "appointment",
                title: "Bạn có lịch hẹn mới",
                body: `Bệnh nhân đã đặt lịch: ${schedule.date} - ${appointment.appointmentTime}`,
            });
        }
        catch (err) {
            console.error("Notify doctor about booking failed:", err);
        }
        // Return hold info so client can show countdown and proceed to payment
        res.status(201).json({
            success: true,
            data: appointment,
            message: "Đặt lịch tạm giữ, chờ thanh toán",
            holdExpiresAt,
        });
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
        if (!patientId) {
            res.status(400).json({ message: "Missing patientId" });
            return;
        }
        // First, release any expired holds found for this patient (best-effort).
        const now = new Date();
        const expiredHolds = yield Appointment_1.default.find({
            patientId,
            status: appointment_1.AppointmentStatus.AWAIT_PAYMENT,
            holdExpiresAt: { $lte: now },
        });
        for (const h of expiredHolds) {
            try {
                // mark as overdue for payment so UI can show proper state
                h.status = appointment_1.AppointmentStatus.PAYMENT_OVERDUE;
                yield h.save();
                if (h.scheduleId) {
                    yield DoctorSchedule_1.default.findByIdAndUpdate(h.scheduleId, {
                        isBooked: false,
                    });
                }
            }
            catch (e) {
                console.error("Failed to release expired hold", h._id, e);
            }
        }
        const appointments = yield Appointment_1.default.find({ patientId })
            .populate({
            path: "patientId",
            select: "name email phone",
            model: "Patient",
        })
            .populate({
            path: "doctorId",
            select: "name specialty workplace",
            model: "Doctor",
        })
            .populate({
            path: "scheduleId",
            model: "DoctorSchedule",
        })
            // include the proposed new schedule object when doctor suggested a reschedule
            .populate({
            path: "newScheduleId",
            model: "DoctorSchedule",
        })
            .sort({ createdAt: -1 })
            .lean();
        // console.log("API - Found appointments:", appointments.length);
        // Send response with data property
        res.json({
            success: true,
            data: appointments,
        });
    }
    catch (error) {
        console.error("API Error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching appointments",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.getPatientAppointments = getPatientAppointments;
// Patient: Lấy lịch sử lịch hẹn (đã hoàn thành hoặc đã hủy)
const getAppointmentHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId } = req.query;
        if (!patientId) {
            res.status(400).json({ message: "Thiếu patientId" });
            return;
        }
        const list = yield Appointment_1.default.find({
            patientId,
            status: {
                $in: [appointment_1.AppointmentStatus.COMPLETED, appointment_1.AppointmentStatus.CANCELLED],
            },
        })
            .populate("patientId", "name email phone")
            .populate("doctorId", "name specialty workplace")
            .populate("scheduleId")
            .populate({ path: "newScheduleId", model: "DoctorSchedule" })
            .sort({ updatedAt: -1 })
            .lean();
        res.json(list);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy lịch sử lịch hẹn", error });
    }
});
exports.getAppointmentHistory = getAppointmentHistory;
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
        if (appointment.status === appointment_1.AppointmentStatus.COMPLETED) {
            res.status(400).json({ message: "Không thể hủy lịch hẹn đã hoàn thành" });
            return;
        }
        // Enforce 24-hour rule: cannot cancel within 24 hours of appointment start
        try {
            const apptDate = appointment.appointmentDate; // YYYY-MM-DD
            const apptTime = appointment.appointmentTime || "00:00"; // HH:mm
            const apptDateTime = new Date(`${apptDate}T${apptTime}:00`);
            const ms24 = 24 * 60 * 60 * 1000;
            const now = new Date();
            if (apptDateTime.getTime() - now.getTime() <= ms24) {
                // If caller provided force=true (admin or explicit override), allow; otherwise reject
                const { force } = req.body;
                if (!force) {
                    res
                        .status(400)
                        .json({ message: "Không thể hủy trong vòng 24 giờ trước giờ hẹn" });
                    return;
                }
            }
        }
        catch (e) {
            // if parsing fails, fall back to previous behavior
        }
        appointment.status = appointment_1.AppointmentStatus.CANCELLED;
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
        if (appointment.status !== appointment_1.AppointmentStatus.BOOKED) {
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
// Doctor: request extension for a current appointment
const extendAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { minutes, doctorId, reason } = req.body;
        if (!minutes || !doctorId) {
            return res.status(400).json({ message: "Missing input" });
        }
        const appointment = yield Appointment_1.default.findById(id);
        if (!appointment)
            return res.status(404).json({ message: "Not found" });
        // Only allow extension while in consultation or confirmed
        if (![appointment_1.AppointmentStatus.CONFIRMED, appointment_1.AppointmentStatus.IN_CONSULT].includes(appointment.status)) {
            return res
                .status(400)
                .json({ message: "Cannot request extension for this appointment" });
        }
        // Find the next appointment for same doctor on same date/time ordering
        const next = yield Appointment_1.default.findOne({
            doctorId: appointment.doctorId,
            appointmentDate: appointment.appointmentDate,
            _id: { $ne: appointment._id },
            status: { $nin: [appointment_1.AppointmentStatus.CANCELLED] },
        })
            .where("createdAt")
            .gt(appointment.createdAt)
            .sort({ createdAt: 1 })
            .exec();
        const now = new Date();
        // Build extension object
        const ext = {
            minutes,
            status: "consent_pending",
            requestedBy: new mongoose_1.default.Types.ObjectId(doctorId),
            requestedAt: now,
            reason: reason || "",
            consentRequestedAt: now,
            consentExpiresAt: new Date(now.getTime() + 3 * 60 * 1000), // 3 min
        };
        if (next)
            ext.targetNextApptId = next._id;
        appointment.extension = ext;
        yield appointment.save();
        // Notify next patient if exists
        if (next) {
            try {
                yield (0, notificationService_1.createNotification)({
                    userId: String(next.patientId),
                    type: "appointment",
                    title: "Yêu cầu gia hạn từ bác sĩ",
                    body: `Bác sĩ muốn kéo dài buổi khám thêm ${minutes} phút. Bạn có đồng ý chờ?`,
                    meta: { appointmentId: next._id, fromAppointmentId: appointment._id },
                });
            }
            catch (e) {
                console.error("Notify next patient failed", e);
            }
        }
        res.json({
            message: "Extension requested",
            extension: appointment.extension,
        });
    }
    catch (err) {
        console.error(err);
        res
            .status(500)
            .json({ message: "Error requesting extension", error: String(err) });
    }
});
exports.extendAppointment = extendAppointment;
// Patient: respond to extension consent request
const extensionConsent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { nextId } = req.params;
        const { response, patientId } = req.body;
        const next = yield Appointment_1.default.findById(nextId);
        if (!next)
            return res.status(404).json({ message: "Next appointment not found" });
        // find the appointment that requested consent and points to this nextId
        const requester = yield Appointment_1.default.findOne({
            "extension.targetNextApptId": next._id,
            "extension.status": "consent_pending",
        });
        if (!requester)
            return res
                .status(404)
                .json({ message: "No pending extension request found" });
        const now = new Date();
        if (requester.extension &&
            requester.extension.consentExpiresAt &&
            requester.extension.consentExpiresAt < now) {
            requester.extension.status = "timeout";
            yield requester.save();
            return res.status(410).json({ message: "Consent expired" });
        }
        if (String(next.patientId) !== String(patientId)) {
            return res.status(403).json({ message: "Not authorized" });
        }
        if (response === "accept") {
            requester.extension.status = "accepted";
            requester.extension.consentBy = new mongoose_1.default.Types.ObjectId(patientId);
            requester.extension.consentResponse = "accepted";
            requester.extension.appliedAt = now;
            yield requester.save();
            // Shift next appointment by minutes
            const minutes = Number(requester.extension.minutes || 0);
            if (minutes > 0) {
                // naive shift: update appointment time fields if possible
                // For MVP, keep appointmentDate same and just append an offset in patient-visible ETA
                // TODO: implement robust time shifting and conflict checks
                next.note =
                    (next.note || "") +
                        `\n[Shifted by ${minutes} minutes due to previous appointment]`;
                yield next.save();
            }
            try {
                yield (0, notificationService_1.createNotification)({
                    userId: String(requester.doctorId),
                    type: "appointment",
                    title: "Bệnh nhân đồng ý gia hạn",
                    body: `Bệnh nhân đã đồng ý chờ thêm ${requester.extension.minutes} phút`,
                });
            }
            catch (e) {
                console.error("Notify doctor failed", e);
            }
            return res.json({
                message: "Accepted",
                extension: requester.extension,
            });
        }
        else {
            requester.extension.status = "declined";
            requester.extension.consentResponse = "declined";
            yield requester.save();
            try {
                yield (0, notificationService_1.createNotification)({
                    userId: String(requester.doctorId),
                    type: "appointment",
                    title: "Bệnh nhân từ chối gia hạn",
                    body: `Bệnh nhân không đồng ý chờ. Vui lòng chọn phương án khác.`,
                });
            }
            catch (e) {
                console.error("Notify doctor failed", e);
            }
            return res.json({
                message: "Declined",
                extension: requester.extension,
            });
        }
    }
    catch (err) {
        console.error(err);
        res
            .status(500)
            .json({ message: "Error handling consent", error: String(err) });
    }
});
exports.extensionConsent = extensionConsent;
// Patient/Doctor check-in endpoint
const checkinAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { by } = req.body;
        if (!id || !by) {
            return res
                .status(400)
                .json({ message: "Missing appointment id or 'by'" });
        }
        const appointment = yield Appointment_1.default.findById(id);
        if (!appointment)
            return res.status(404).json({ message: "Not found" });
        const now = new Date();
        appointment.meta = appointment.meta || {};
        if (by === "patient") {
            appointment.meta.patientCheckedInAt = now;
            // optional: when patient checks in, notify doctor
            try {
                yield (0, notificationService_1.createNotification)({
                    userId: String(appointment.doctorId),
                    type: "appointment",
                    title: "Bệnh nhân đã đến",
                    body: `Bệnh nhân đã check-in cho lịch ${appointment._id}`,
                });
            }
            catch (e) {
                console.error("Notify doctor on patient check-in failed", e);
            }
        }
        else {
            appointment.meta.doctorCheckedInAt = now;
            // optional: when doctor checks in, notify patient
            try {
                yield (0, notificationService_1.createNotification)({
                    userId: String(appointment.patientId),
                    type: "appointment",
                    title: "Bác sĩ sẵn sàng khám",
                    body: `Bác sĩ đã sẵn sàng cho lịch ${appointment._id}`,
                });
            }
            catch (e) {
                console.error("Notify patient on doctor check-in failed", e);
            }
        }
        yield appointment.save();
        res.json({ message: "Checked in", appointment });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error on checkin", error: String(err) });
    }
});
exports.checkinAppointment = checkinAppointment;
// Patient: propose reschedule (send array of schedule ids or free-text slots)
const reschedulePropose = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { patientId, proposedSlots, message } = req.body;
        if (!id || !patientId) {
            return res
                .status(400)
                .json({ message: "Missing appointment id or patientId" });
        }
        const appt = yield Appointment_1.default.findOne({ _id: id, patientId });
        if (!appt)
            return res.status(404).json({ message: "Appointment not found" });
        // Do not allow proposing reschedule once consultation started
        if (appt.status === appointment_1.AppointmentStatus.IN_CONSULT) {
            return res
                .status(400)
                .json({ message: "Cannot reschedule after consultation has started" });
        }
        // Attach a reschedule object to meta
        const now = new Date();
        appt.meta = appt.meta || {};
        appt.meta.reschedule = {
            proposedBy: "patient",
            proposedAt: now,
            proposedSlots: proposedSlots || [],
            message: message || "",
            expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // default 7 days
        };
        yield appt.save();
        // Notify doctor
        try {
            yield (0, notificationService_1.createNotification)({
                userId: String(appt.doctorId),
                type: "appointment",
                title: "Bệnh nhân đề nghị đổi lịch",
                body: `Bệnh nhân đã đề nghị đổi lịch cho lịch ${String(appt._id)}.`,
                meta: { appointmentId: appt._id },
            });
        }
        catch (e) {
            console.error("Notify doctor about reschedule propose failed", e);
        }
        res.json({ message: "Reschedule proposed", appointment: appt });
    }
    catch (err) {
        console.error(err);
        res
            .status(500)
            .json({ message: "Error proposing reschedule", error: String(err) });
    }
});
exports.reschedulePropose = reschedulePropose;
// Patient: accept a reschedule (either doctor's proposed newScheduleId or a selected slot)
const rescheduleAccept = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { patientId, slotId, acceptDoctorProposal } = req.body;
        if (!id || !patientId)
            return res.status(400).json({ message: "Missing input" });
        const appt = yield Appointment_1.default.findOne({ _id: id, patientId });
        if (!appt)
            return res.status(404).json({ message: "Appointment not found" });
        if (!((_a = appt.meta) === null || _a === void 0 ? void 0 : _a.reschedule)) {
            return res.status(400).json({ message: "No reschedule pending" });
        }
        // If doctor proposed a newScheduleId (stored in appointment.newScheduleId), accept it
        if (acceptDoctorProposal && appt.newScheduleId) {
            // move schedule booking
            const oldScheduleId = appt.scheduleId;
            appt.scheduleId = appt.newScheduleId;
            appt.newScheduleId = undefined;
            appt.status = appointment_1.AppointmentStatus.BOOKED;
            appt.meta.reschedule.acceptedAt = new Date();
            appt.meta.reschedule.acceptedBy = "patient";
            yield appt.save();
            // update doctor schedule flags
            try {
                if (oldScheduleId) {
                    yield DoctorSchedule_1.default.findByIdAndUpdate(oldScheduleId, {
                        isBooked: false,
                    });
                }
                if (appt.scheduleId) {
                    yield DoctorSchedule_1.default.findByIdAndUpdate(appt.scheduleId, {
                        isBooked: true,
                    });
                }
            }
            catch (e) {
                console.error("Failed to update schedule flags", e);
            }
            try {
                yield (0, notificationService_1.createNotification)({
                    userId: String(appt.doctorId),
                    type: "appointment",
                    title: "Bệnh nhân xác nhận đổi lịch",
                    body: `Bệnh nhân đã xác nhận lịch mới cho ${String(appt._id)}`,
                    meta: { appointmentId: appt._id },
                });
            }
            catch (e) {
                console.error("Notify doctor failed", e);
            }
            return res.json({
                message: "Accepted doctor's reschedule",
                appointment: appt,
            });
        }
        // Otherwise if patient selected a slotId, attempt to move
        if (slotId) {
            const newSchedule = yield DoctorSchedule_1.default.findOne({
                _id: slotId,
                isBooked: false,
            });
            if (!newSchedule)
                return res.status(404).json({ message: "Selected slot not available" });
            const oldScheduleId = appt.scheduleId;
            appt.scheduleId = newSchedule._id;
            appt.status = appointment_1.AppointmentStatus.BOOKED;
            appt.meta.reschedule.acceptedAt = new Date();
            appt.meta.reschedule.acceptedBy = "patient";
            yield appt.save();
            try {
                if (oldScheduleId) {
                    yield DoctorSchedule_1.default.findByIdAndUpdate(oldScheduleId, {
                        isBooked: false,
                    });
                }
                yield DoctorSchedule_1.default.findByIdAndUpdate(newSchedule._id, {
                    isBooked: true,
                });
            }
            catch (e) {
                console.error("Failed to update schedule flags", e);
            }
            try {
                yield (0, notificationService_1.createNotification)({
                    userId: String(appt.doctorId),
                    type: "appointment",
                    title: "Bệnh nhân xác nhận đổi lịch",
                    body: `Bệnh nhân đã chọn lịch mới cho ${String(appt._id)}`,
                    meta: { appointmentId: appt._id },
                });
            }
            catch (e) {
                console.error("Notify doctor failed", e);
            }
            return res.json({ message: "Reschedule accepted", appointment: appt });
        }
        return res.status(400).json({ message: "No action taken" });
    }
    catch (err) {
        console.error(err);
        res
            .status(500)
            .json({ message: "Error accepting reschedule", error: String(err) });
    }
});
exports.rescheduleAccept = rescheduleAccept;
