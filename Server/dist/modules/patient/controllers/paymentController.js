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
exports.refundPayment = exports.getPaymentStatus = exports.getPaymentHistory = exports.createFinalInvoice = exports.processPayment = exports.createConsultationInvoice = void 0;
const Appointment_1 = __importDefault(require("../models/Appointment"));
const Invoice_1 = __importDefault(require("../models/Invoice"));
const Payment_1 = __importDefault(require("../models/Payment"));
const DoctorSchedule_1 = __importDefault(require("../../doctor/models/DoctorSchedule"));
const computePricing_1 = require("../../pricing/services/computePricing");
const appointment_1 = require("../../../shared/types/appointment");
const payment_1 = require("../../../shared/constants/payment");
// Helper to safely resolve doctorId to a plain string id. Accepts:
// - a string ObjectId
// - a populated mongoose document with an _id field
// - an ObjectId instance
// Returns undefined when a usable id can't be derived.
const resolveDoctorId = (docField) => {
    if (!docField)
        return undefined;
    if (typeof docField === "string") {
        const s = docField.trim();
        if (/^[0-9a-fA-F]{24}$/.test(s))
            return s;
        return undefined;
    }
    // mongoose ObjectId or object with _id
    if (typeof docField === "object") {
        if (docField === null || docField === void 0 ? void 0 : docField._id)
            return String(docField._id);
        // Some drivers may provide an ObjectId-like toString()
        try {
            const s = String(docField);
            if (/^[0-9a-fA-F]{24}$/.test(s))
                return s;
        }
        catch (_a) { }
    }
    return undefined;
};
// Create consultation invoice when doctor approves
const createConsultationInvoice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const { appointmentId } = req.params;
        const { consultationFee, depositAmount, insuranceCoverage } = req.body;
        const appointment = yield Appointment_1.default.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
        }
        // If hold expired or appointment already marked overdue, reject payment
        const now = new Date();
        if (appointment.status === appointment_1.AppointmentStatus.PAYMENT_OVERDUE ||
            (appointment.holdExpiresAt && appointment.holdExpiresAt <= now)) {
            if (appointment.status !== appointment_1.AppointmentStatus.PAYMENT_OVERDUE) {
                appointment.status = appointment_1.AppointmentStatus.PAYMENT_OVERDUE;
                yield appointment.save();
                // release the schedule slot so others can book
                try {
                    if (appointment.scheduleId) {
                        yield DoctorSchedule_1.default.findByIdAndUpdate(appointment.scheduleId, {
                            isBooked: false,
                        });
                    }
                }
                catch (e) {
                    console.error("Failed to release schedule on overdue (create invoice path)", e);
                }
            }
            return res
                .status(400)
                .json({ message: "Hết thời gian thanh toán. Đơn đặt bị quá hạn." });
        }
        // Allow invoice creation when doctor already approved OR when appointment
        // was moved to await_payment (UI/flow may set await_payment first)
        if (appointment.status !== appointment_1.AppointmentStatus.DOCTOR_APPROVED &&
            appointment.status !== appointment_1.AppointmentStatus.AWAIT_PAYMENT) {
            return res
                .status(400)
                .json({ message: "Lịch hẹn chưa được bác sĩ chấp nhận" });
        }
        // Resolve numeric inputs safely: use request body if provided otherwise fall back
        // to appointment stored values. Coerce to Number and guard against NaN.
        const feeInput = Number(
        // prefer explicit body value, then appointment value, then 0
        (_a = consultationFee !== null && consultationFee !== void 0 ? consultationFee : appointment.consultationFee) !== null && _a !== void 0 ? _a : 0);
        const depositInput = Number((_b = depositAmount !== null && depositAmount !== void 0 ? depositAmount : appointment.depositAmount) !== null && _b !== void 0 ? _b : 0);
        const coverageInput = Number(
        // coverage as percentage (0-100)
        (_c = insuranceCoverage !== null && insuranceCoverage !== void 0 ? insuranceCoverage : appointment.insuranceCoverage) !== null && _c !== void 0 ? _c : 0);
        if (Number.isNaN(feeInput) ||
            Number.isNaN(depositInput) ||
            Number.isNaN(coverageInput)) {
            return res.status(400).json({ message: "Dữ liệu tiền không hợp lệ" });
        }
        // If a pending consultation invoice already exists, keep a reference.
        const existing = yield Invoice_1.default.findOne({
            appointmentId,
            type: "consultation",
            status: appointment_1.PaymentStatus.PENDING,
        });
        // If existing invoice is present and already has non-zero subtotal, return it
        if (existing && existing.subtotal && existing.subtotal > 0) {
            return res.json({
                message: "Hóa đơn tạm ứng đã tồn tại",
                invoice: existing,
                appointment,
            });
        }
        // Calculate per-item insurance: typically deposit is not covered.
        const consultationInsurance = Math.round((feeInput * (coverageInput || 0)) / 100);
        const consultationPatient = feeInput - consultationInsurance;
        const depositPatient = depositInput; // deposit not covered
        const items = [];
        if (feeInput > 0) {
            items.push({
                type: appointment_1.PaymentType.CONSULTATION_FEE,
                description: "Phí khám cơ bản",
                amount: feeInput,
                insuranceCoverage: coverageInput > 0
                    ? appointment_1.InsuranceCoverage.PARTIAL_COVERAGE
                    : appointment_1.InsuranceCoverage.NO_COVERAGE,
                insuranceAmount: consultationInsurance,
                patientAmount: consultationPatient,
            });
        }
        if (depositInput > 0) {
            items.push({
                type: appointment_1.PaymentType.DEPOSIT,
                description: "Đặt cọc giữ chỗ",
                amount: depositInput,
                insuranceCoverage: appointment_1.InsuranceCoverage.NO_COVERAGE,
                insuranceAmount: 0,
                patientAmount: depositPatient,
            });
        }
        const subtotal = feeInput + depositInput;
        const totalInsurance = consultationInsurance; // deposit not covered
        const totalPatient = consultationPatient + depositPatient;
        // If inputs are zero and we have an existing zero invoice, try to compute pricing
        if (feeInput <= 0 && depositInput <= 0 && existing) {
            try {
                const parseService = (note) => {
                    var _a;
                    if (!note)
                        return "";
                    const m = note.match(/\[Dịch vụ\]\s*([^|\n]+)/);
                    return ((_a = m === null || m === void 0 ? void 0 : m[1]) === null || _a === void 0 ? void 0 : _a.trim()) || "";
                };
                const serviceCode = parseService(appointment.note) || "";
                const durationMin = 45; // fallback
                const startAt = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}:00`).toISOString();
                const bhytEligible = (appointment.insuranceCoverage || 0) > 0;
                const copayRate = (appointment.insuranceCoverage || 0) / 100;
                const computed = yield (0, computePricing_1.computeConsultPrice)({
                    serviceCode,
                    doctorId: resolveDoctorId(appointment.doctorId),
                    durationMin,
                    startAt,
                    bhytEligible,
                    copayRate,
                });
                const mappedItems = computed.items.map((it) => {
                    const type = it.component === "facility"
                        ? appointment_1.PaymentType.CONSULTATION_FEE
                        : appointment_1.PaymentType.ADDITIONAL_SERVICES;
                    return {
                        type,
                        description: it.description,
                        amount: it.amount,
                        insuranceCoverage: it.payer === "bhyt"
                            ? appointment_1.InsuranceCoverage.PARTIAL_COVERAGE
                            : appointment_1.InsuranceCoverage.NO_COVERAGE,
                        insuranceAmount: it.insuranceAmount || 0,
                        patientAmount: it.patientAmount || 0,
                    };
                });
                existing.items = mappedItems;
                existing.subtotal = computed.totals.total;
                existing.insuranceCoverage = computed.totals.bhyt;
                existing.patientAmount = computed.totals.patient;
                existing.dueDate = new Date(Date.now() + payment_1.PAYMENT_HOLD_MS);
                yield existing.save();
                // Update appointment totals and set hold expiry to match invoice dueDate
                appointment.status = appointment_1.AppointmentStatus.AWAIT_PAYMENT;
                appointment.holdExpiresAt = existing.dueDate;
                appointment.consultationFee = (_d = appointment.consultationFee) !== null && _d !== void 0 ? _d : 0;
                appointment.depositAmount = (_e = appointment.depositAmount) !== null && _e !== void 0 ? _e : 0;
                appointment.totalAmount = computed.totals.total;
                appointment.insuranceCoverage = computed.totals.bhyt;
                appointment.patientAmount = computed.totals.patient;
                yield appointment.save();
                return res.json({
                    message: "Đã cập nhật hóa đơn tạm ứng",
                    invoice: existing,
                    appointment,
                });
            }
            catch (err) {
                console.error("Compute pricing failed:", err);
                // fallthrough: if compute fails, return existing invoice as-is
                return res.json({
                    message: "Hóa đơn tạm ứng đã tồn tại",
                    invoice: existing,
                    appointment,
                });
            }
        }
        // If inputs are zero and no existing invoice, attempt to compute pricing
        if (feeInput <= 0 && depositInput <= 0 && !existing) {
            try {
                const parseService = (note) => {
                    var _a;
                    if (!note)
                        return "";
                    const m = note.match(/\[Dịch vụ\]\s*([^|\n]+)/);
                    return ((_a = m === null || m === void 0 ? void 0 : m[1]) === null || _a === void 0 ? void 0 : _a.trim()) || "";
                };
                const serviceCode = parseService(appointment.note) || "";
                const durationMin = 45; // default duration in minutes when unknown
                const startAt = appointment.appointmentDate && appointment.appointmentTime
                    ? new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}:00`).toISOString()
                    : new Date().toISOString();
                const bhytEligible = (appointment.insuranceCoverage || 0) > 0;
                const copayRate = (appointment.insuranceCoverage || 0) / 100;
                const computed = yield (0, computePricing_1.computeConsultPrice)({
                    serviceCode,
                    doctorId: resolveDoctorId(appointment.doctorId),
                    durationMin,
                    startAt,
                    bhytEligible,
                    copayRate,
                });
                const mappedItems = computed.items.map((it) => {
                    const type = it.component === "facility"
                        ? appointment_1.PaymentType.CONSULTATION_FEE
                        : appointment_1.PaymentType.ADDITIONAL_SERVICES;
                    return {
                        type,
                        description: it.description,
                        amount: it.amount,
                        insuranceCoverage: it.payer === "bhyt"
                            ? appointment_1.InsuranceCoverage.PARTIAL_COVERAGE
                            : appointment_1.InsuranceCoverage.NO_COVERAGE,
                        insuranceAmount: it.insuranceAmount || 0,
                        patientAmount: it.patientAmount || 0,
                    };
                });
                const invoice = yield Invoice_1.default.create({
                    appointmentId,
                    type: "consultation",
                    items: mappedItems,
                    subtotal: computed.totals.total,
                    insuranceCoverage: computed.totals.bhyt,
                    patientAmount: computed.totals.patient,
                    dueDate: new Date(Date.now() + payment_1.PAYMENT_HOLD_MS),
                });
                // set hold expiry on appointment to keep invoice/appointment in sync
                appointment.status = appointment_1.AppointmentStatus.AWAIT_PAYMENT;
                appointment.totalAmount = computed.totals.total;
                appointment.insuranceCoverage = computed.totals.bhyt;
                appointment.patientAmount = computed.totals.patient;
                appointment.holdExpiresAt = invoice.dueDate;
                yield appointment.save();
                return res.json({
                    message: "Đã tạo hóa đơn tạm ứng (compute)",
                    invoice,
                    appointment,
                });
            }
            catch (err) {
                console.error("Compute pricing failed (create path):", err);
                return res
                    .status(400)
                    .json({ message: "Không có khoản phí để tạo hóa đơn" });
            }
        }
        // Create invoice (normal path)
        const invoice = yield Invoice_1.default.create({
            appointmentId,
            type: "consultation",
            items,
            subtotal,
            insuranceCoverage: totalInsurance,
            patientAmount: totalPatient,
            dueDate: new Date(Date.now() + payment_1.PAYMENT_HOLD_MS), // payment hold duration from now
        });
        // Update appointment
        appointment.status = appointment_1.AppointmentStatus.AWAIT_PAYMENT;
        appointment.consultationFee = feeInput;
        appointment.depositAmount = depositInput;
        appointment.totalAmount = subtotal;
        appointment.insuranceCoverage = totalInsurance;
        appointment.patientAmount = totalPatient;
        // sync holdExpiresAt with invoice due date
        appointment.holdExpiresAt = invoice.dueDate;
        yield appointment.save();
        res.json({
            message: "Đã tạo hóa đơn tạm ứng",
            invoice,
            appointment,
        });
    }
    catch (error) {
        const err = error;
        console.error("Error creating consultation invoice:", err);
        res.status(500).json({ message: "Lỗi tạo hóa đơn", error: err.message });
    }
});
exports.createConsultationInvoice = createConsultationInvoice;
// Process payment
const processPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { appointmentId, invoiceId, paymentMethod, transactionId } = req.body;
        const appointment = yield Appointment_1.default.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
        }
        const invoice = yield Invoice_1.default.findById(invoiceId);
        if (!invoice) {
            return res.status(404).json({ message: "Không tìm thấy hóa đơn" });
        }
        // Enforce hold expiration: do not allow processing payment if hold or invoice due date expired
        const now = new Date();
        if (appointment.status === appointment_1.AppointmentStatus.PAYMENT_OVERDUE ||
            (appointment.holdExpiresAt && appointment.holdExpiresAt <= now) ||
            (invoice.dueDate && invoice.dueDate <= now)) {
            if (appointment.status !== appointment_1.AppointmentStatus.PAYMENT_OVERDUE) {
                appointment.status = appointment_1.AppointmentStatus.PAYMENT_OVERDUE;
                yield appointment.save();
                // release schedule slot
                try {
                    if (appointment.scheduleId) {
                        yield DoctorSchedule_1.default.findByIdAndUpdate(appointment.scheduleId, {
                            isBooked: false,
                        });
                    }
                }
                catch (e) {
                    console.error("Failed to release schedule on overdue (processPayment)", e);
                }
            }
            return res
                .status(400)
                .json({ message: "Hết thời gian thanh toán. Đơn đặt bị quá hạn." });
        }
        // Create payment record
        const payment = yield Payment_1.default.create({
            appointmentId,
            invoiceId,
            amount: invoice.patientAmount,
            status: appointment_1.PaymentStatus.CAPTURED,
            paymentMethod,
            transactionId,
            capturedAt: new Date(),
        });
        // Update invoice
        invoice.status = appointment_1.PaymentStatus.CAPTURED;
        invoice.paidAt = new Date();
        yield invoice.save();
        // Update appointment
        appointment.status = appointment_1.AppointmentStatus.CONFIRMED;
        appointment.paymentStatus = appointment_1.PaymentStatus.CAPTURED;
        appointment.confirmedAt = new Date();
        yield appointment.save();
        res.json({
            message: "Thanh toán thành công",
            payment,
            appointment,
        });
    }
    catch (error) {
        const err = error;
        console.error("Error processing payment:", err);
        res
            .status(500)
            .json({ message: "Lỗi xử lý thanh toán", error: err.message });
    }
});
exports.processPayment = processPayment;
// Create final settlement invoice after consultation
const createFinalInvoice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { appointmentId } = req.params;
        const { additionalServices, diagnosis, prescription } = req.body;
        const appointment = yield Appointment_1.default.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
        }
        if (appointment.status !== appointment_1.AppointmentStatus.IN_CONSULT) {
            return res.status(400).json({ message: "Lịch hẹn chưa bắt đầu khám" });
        }
        // Calculate additional services cost
        const additionalCost = (additionalServices === null || additionalServices === void 0 ? void 0 : additionalServices.reduce((sum, service) => sum + service.cost, 0)) || 0;
        const totalAdditionalCost = additionalCost;
        const insuranceCoverageAmount = (totalAdditionalCost * (appointment.insuranceCoverage || 0)) / 100;
        const patientAdditionalAmount = totalAdditionalCost - insuranceCoverageAmount;
        // Create final invoice
        const invoice = yield Invoice_1.default.create({
            appointmentId,
            type: "final_settlement",
            items: (additionalServices === null || additionalServices === void 0 ? void 0 : additionalServices.map((service) => ({
                type: appointment_1.PaymentType.ADDITIONAL_SERVICES,
                description: service.name,
                amount: service.cost,
                insuranceCoverage: (appointment.insuranceCoverage || 0) > 0
                    ? appointment_1.InsuranceCoverage.PARTIAL_COVERAGE
                    : appointment_1.InsuranceCoverage.NO_COVERAGE,
                insuranceAmount: (service.cost * (appointment.insuranceCoverage || 0)) / 100,
                patientAmount: service.cost -
                    (service.cost * (appointment.insuranceCoverage || 0)) / 100,
            }))) || [],
            subtotal: totalAdditionalCost,
            insuranceCoverage: insuranceCoverageAmount,
            patientAmount: patientAdditionalAmount,
        });
        // Update appointment
        appointment.status = appointment_1.AppointmentStatus.READY_TO_DISCHARGE;
        appointment.diagnosis = diagnosis;
        appointment.prescription = prescription;
        appointment.additionalServices = additionalServices;
        yield appointment.save();
        res.json({
            message: "Đã tạo hóa đơn quyết toán",
            invoice,
            appointment,
        });
    }
    catch (error) {
        const err = error;
        console.error("Error creating final invoice:", err);
        res
            .status(500)
            .json({ message: "Lỗi tạo hóa đơn quyết toán", error: err.message });
    }
});
exports.createFinalInvoice = createFinalInvoice;
// Get payment history
const getPaymentHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const patientId = req.patientId; // from patient auth middleware
        if (!patientId) {
            return res.status(401).json({ message: "Token bệnh nhân không hợp lệ" });
        }
        // Find appointments that belong to this patient, then query payments linked to them.
        const patientAppointments = yield Appointment_1.default.find({ patientId }).select("_id");
        const appointmentIds = patientAppointments.map((a) => a._id);
        const payments = yield Payment_1.default.find({
            appointmentId: { $in: appointmentIds },
        })
            .populate({
            path: "appointmentId",
            select: "_id appointmentDate appointmentTime status",
            populate: { path: "doctorId", select: "name specialty" },
        })
            .sort({ createdAt: -1 });
        res.json(payments);
    }
    catch (error) {
        const err = error;
        console.error("Error getting payment history:", err);
        res
            .status(500)
            .json({ message: "Lỗi lấy lịch sử thanh toán", error: err.message });
    }
});
exports.getPaymentHistory = getPaymentHistory;
// Get payment status for appointment
const getPaymentStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { appointmentId } = req.params;
        const patientId = req.patientId;
        const appointment = yield Appointment_1.default.findById(appointmentId)
            .populate("patientId", "name email phone")
            .populate("doctorId", "name specialty");
        if (!appointment) {
            return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
        }
        // Verify patient can only access their own appointments
        if (appointment.patientId._id.toString() !== patientId) {
            return res
                .status(403)
                .json({ message: "Không có quyền truy cập thông tin thanh toán này" });
        }
        let invoices = yield Invoice_1.default.find({ appointmentId });
        const payments = yield Payment_1.default.find({ appointmentId });
        // If there are no invoices but the appointment is already in a payment-related
        // status, attempt to compute pricing and create a pending consultation invoice
        // so the patient UI can display it immediately.
        if ((!invoices || invoices.length === 0) &&
            (appointment.status === appointment_1.AppointmentStatus.DOCTOR_APPROVED ||
                appointment.status === appointment_1.AppointmentStatus.AWAIT_PAYMENT)) {
            try {
                const parseService = (note) => {
                    var _a;
                    if (!note)
                        return "";
                    const m = note.match(/\[Dịch vụ\]\s*([^|\n]+)/);
                    return ((_a = m === null || m === void 0 ? void 0 : m[1]) === null || _a === void 0 ? void 0 : _a.trim()) || "";
                };
                const serviceCode = parseService(appointment.note) || "";
                const durationMin = 45; // fallback when unknown
                const startAt = appointment.appointmentDate && appointment.appointmentTime
                    ? new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}:00`).toISOString()
                    : new Date().toISOString();
                const bhytEligible = (appointment.insuranceCoverage || 0) > 0;
                const copayRate = (appointment.insuranceCoverage || 0) / 100;
                const computed = yield (0, computePricing_1.computeConsultPrice)({
                    serviceCode,
                    doctorId: resolveDoctorId(appointment.doctorId),
                    durationMin,
                    startAt,
                    bhytEligible,
                    copayRate,
                });
                const mappedItems = computed.items.map((it) => {
                    const type = it.component === "facility"
                        ? appointment_1.PaymentType.CONSULTATION_FEE
                        : appointment_1.PaymentType.ADDITIONAL_SERVICES;
                    return {
                        type,
                        description: it.description,
                        amount: it.amount,
                        insuranceCoverage: it.payer === "bhyt"
                            ? appointment_1.InsuranceCoverage.PARTIAL_COVERAGE
                            : appointment_1.InsuranceCoverage.NO_COVERAGE,
                        insuranceAmount: it.insuranceAmount || 0,
                        patientAmount: it.patientAmount || 0,
                    };
                });
                const invoice = yield Invoice_1.default.create({
                    appointmentId,
                    type: "consultation",
                    items: mappedItems,
                    subtotal: computed.totals.total,
                    insuranceCoverage: computed.totals.bhyt,
                    patientAmount: computed.totals.patient,
                    dueDate: new Date(Date.now() + payment_1.PAYMENT_HOLD_MS),
                });
                // update appointment totals as well
                appointment.status = appointment_1.AppointmentStatus.AWAIT_PAYMENT;
                appointment.totalAmount = computed.totals.total;
                appointment.insuranceCoverage = computed.totals.bhyt;
                appointment.patientAmount = computed.totals.patient;
                // sync appointment hold expiry with invoice dueDate
                appointment.holdExpiresAt = invoice.dueDate;
                yield appointment.save();
                invoices = [invoice];
            }
            catch (err) {
                console.error("Failed to compute/create invoice on status fetch:", err);
                // If compute failed, try to create invoice from appointment-stored fees
                try {
                    const fee = Number(appointment.consultationFee || 0);
                    const deposit = Number(appointment.depositAmount || 0);
                    if (fee > 0 || deposit > 0) {
                        const items = [];
                        if (fee > 0) {
                            items.push({
                                type: "consultation_fee",
                                description: "Phí khám cơ bản",
                                amount: fee,
                                insuranceAmount: 0,
                                patientAmount: fee,
                            });
                        }
                        if (deposit > 0) {
                            items.push({
                                type: "deposit",
                                description: "Đặt cọc giữ chỗ",
                                amount: deposit,
                                insuranceAmount: 0,
                                patientAmount: deposit,
                            });
                        }
                        const subtotal = fee + deposit;
                        const invoice = yield Invoice_1.default.create({
                            appointmentId,
                            type: "consultation",
                            items,
                            subtotal,
                            insuranceCoverage: 0,
                            patientAmount: subtotal,
                            dueDate: new Date(Date.now() + payment_1.PAYMENT_HOLD_MS),
                        });
                        appointment.status = appointment_1.AppointmentStatus.AWAIT_PAYMENT;
                        appointment.totalAmount = subtotal;
                        appointment.patientAmount = subtotal;
                        appointment.paymentStatus = appointment_1.PaymentStatus.PENDING;
                        // sync appointment hold expiry with invoice dueDate
                        appointment.holdExpiresAt = invoice.dueDate;
                        yield appointment.save();
                        invoices = [invoice];
                    }
                }
                catch (fallbackErr) {
                    console.error("Fallback invoice create failed:", fallbackErr);
                }
            }
        }
        console.debug(`getPaymentStatus: appointment=${appointmentId} invoices=${invoices.length} payments=${payments.length}`);
        res.json({
            appointment,
            invoices,
            payments,
        });
    }
    catch (error) {
        const err = error;
        console.error("Error getting payment status:", err);
        res
            .status(500)
            .json({ message: "Lỗi lấy trạng thái thanh toán", error: err.message });
    }
});
exports.getPaymentStatus = getPaymentStatus;
// Refund payment
const refundPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { paymentId, refundAmount, reason } = req.body;
        const payment = yield Payment_1.default.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ message: "Không tìm thấy giao dịch" });
        }
        // Update payment
        payment.status = appointment_1.PaymentStatus.REFUNDED;
        payment.refundedAt = new Date();
        payment.refundAmount = refundAmount || payment.amount;
        yield payment.save();
        // Update appointment
        const appointment = yield Appointment_1.default.findById(payment.appointmentId);
        if (appointment) {
            appointment.status = appointment_1.AppointmentStatus.CANCELLED;
            appointment.cancelledAt = new Date();
            appointment.cancelledBy = "system";
            appointment.cancellationReason = reason || "Hoàn tiền";
            yield appointment.save();
        }
        res.json({
            message: "Hoàn tiền thành công",
            payment,
        });
    }
    catch (error) {
        const err = error;
        console.error("Error refunding payment:", err);
        res.status(500).json({ message: "Lỗi hoàn tiền", error: err.message });
    }
});
exports.refundPayment = refundPayment;
