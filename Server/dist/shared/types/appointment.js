"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsuranceCoverage = exports.PaymentType = exports.PaymentStatus = exports.AppointmentStatus = void 0;
var AppointmentStatus;
(function (AppointmentStatus) {
    // Initial states
    AppointmentStatus["BOOKED"] = "booked";
    // Doctor decision states
    AppointmentStatus["DOCTOR_APPROVED"] = "doctor_approved";
    AppointmentStatus["DOCTOR_RESCHEDULE"] = "doctor_reschedule";
    AppointmentStatus["DOCTOR_REJECTED"] = "doctor_rejected";
    // Payment states
    AppointmentStatus["AWAIT_PAYMENT"] = "await_payment";
    AppointmentStatus["PAID"] = "paid";
    AppointmentStatus["PAYMENT_OVERDUE"] = "payment_overdue";
    // Consultation states
    AppointmentStatus["CONFIRMED"] = "confirmed";
    AppointmentStatus["IN_CONSULT"] = "in_consult";
    AppointmentStatus["PRESCRIPTION_ISSUED"] = "prescription_issued";
    AppointmentStatus["READY_TO_DISCHARGE"] = "ready_to_discharge";
    // Final states
    AppointmentStatus["COMPLETED"] = "completed";
    AppointmentStatus["CANCELLED"] = "cancelled";
    AppointmentStatus["CLOSED"] = "closed";
})(AppointmentStatus || (exports.AppointmentStatus = AppointmentStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["AUTHORIZED"] = "authorized";
    PaymentStatus["CAPTURED"] = "captured";
    PaymentStatus["REFUNDED"] = "refunded";
    PaymentStatus["FAILED"] = "failed";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var PaymentType;
(function (PaymentType) {
    PaymentType["CONSULTATION_FEE"] = "consultation_fee";
    PaymentType["DEPOSIT"] = "deposit";
    PaymentType["ADDITIONAL_SERVICES"] = "additional_services";
    PaymentType["MEDICATION"] = "medication";
    PaymentType["FINAL_SETTLEMENT"] = "final_settlement";
})(PaymentType || (exports.PaymentType = PaymentType = {}));
var InsuranceCoverage;
(function (InsuranceCoverage) {
    InsuranceCoverage["FULL_COVERAGE"] = "full_coverage";
    InsuranceCoverage["PARTIAL_COVERAGE"] = "partial_coverage";
    InsuranceCoverage["NO_COVERAGE"] = "no_coverage";
})(InsuranceCoverage || (exports.InsuranceCoverage = InsuranceCoverage = {}));
