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
exports.startExpiredInvoiceMonitor = startExpiredInvoiceMonitor;
exports.stopExpiredInvoiceMonitor = stopExpiredInvoiceMonitor;
const Invoice_1 = __importDefault(require("../modules/patient/models/Invoice"));
const Appointment_1 = __importDefault(require("../modules/patient/models/Appointment"));
const DoctorSchedule_1 = __importDefault(require("../modules/doctor/models/DoctorSchedule"));
const appointment_1 = require("../shared/types/appointment");
const appointment_2 = require("../shared/types/appointment");
const POLL_INTERVAL_MS = 60 * 1000; // check every 60s
let timer = null;
function markExpiredOnce() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const now = new Date();
            const expired = yield Invoice_1.default.find({
                type: "consultation",
                status: appointment_1.PaymentStatus.PENDING,
                dueDate: { $lte: now },
            }).lean();
            if (!expired || expired.length === 0)
                return;
            for (const inv of expired) {
                try {
                    const appointmentId = inv.appointmentId;
                    if (!appointmentId)
                        continue;
                    // Mark appointment as payment_overdue and set holdExpiresAt
                    const appt = yield Appointment_1.default.findById(appointmentId);
                    if (!appt)
                        continue;
                    // Only change if not already overdue/confirmed/cancelled
                    if (appt.status !== appointment_2.AppointmentStatus.PAYMENT_OVERDUE) {
                        appt.status = appointment_2.AppointmentStatus.PAYMENT_OVERDUE;
                        appt.holdExpiresAt = inv.dueDate || appt.holdExpiresAt;
                        yield appt.save();
                    }
                    // release schedule slot if exists
                    if (appt.scheduleId) {
                        try {
                            yield DoctorSchedule_1.default.findByIdAndUpdate(appt.scheduleId, {
                                isBooked: false,
                            });
                        }
                        catch (e) {
                            console.error("Failed to release schedule for appt", appointmentId, e);
                        }
                    }
                }
                catch (e) {
                    console.error("Error handling expired invoice", inv._id, e);
                }
            }
        }
        catch (e) {
            console.error("markExpiredOnce error:", e);
        }
    });
}
function startExpiredInvoiceMonitor() {
    if (timer)
        return; // already running
    // run once immediately
    markExpiredOnce().catch((e) => console.error(e));
    timer = setInterval(() => {
        markExpiredOnce().catch((e) => console.error(e));
    }, POLL_INTERVAL_MS);
    console.log("Started expired-invoice monitor (polling every 60s)");
}
function stopExpiredInvoiceMonitor() {
    if (!timer)
        return;
    clearInterval(timer);
    timer = null;
    console.log("Stopped expired-invoice monitor");
}
exports.default = {
    startExpiredInvoiceMonitor,
    stopExpiredInvoiceMonitor,
};
