import Invoice from "../modules/patient/models/Invoice";
import Appointment from "../modules/patient/models/Appointment";
import DoctorSchedule from "../modules/doctor/models/DoctorSchedule";
import { PaymentStatus } from "../shared/types/appointment";
import { AppointmentStatus } from "../shared/types/appointment";

const POLL_INTERVAL_MS = 60 * 1000; // check every 60s

let timer: NodeJS.Timeout | null = null;

async function markExpiredOnce(): Promise<void> {
  try {
    const now = new Date();
    const expired = await Invoice.find({
      type: "consultation",
      status: PaymentStatus.PENDING,
      dueDate: { $lte: now },
    }).lean();

    if (!expired || expired.length === 0) return;

    for (const inv of expired) {
      try {
        const appointmentId = (inv as any).appointmentId;
        if (!appointmentId) continue;

        // Mark appointment as payment_overdue and set holdExpiresAt
        const appt = await Appointment.findById(appointmentId);
        if (!appt) continue;

        // Only change if not already overdue/confirmed/cancelled
        if (appt.status !== AppointmentStatus.PAYMENT_OVERDUE) {
          appt.status = AppointmentStatus.PAYMENT_OVERDUE;
          appt.holdExpiresAt = inv.dueDate || appt.holdExpiresAt;
          await appt.save();
        }

        // release schedule slot if exists
        if (appt.scheduleId) {
          try {
            await DoctorSchedule.findByIdAndUpdate(appt.scheduleId as any, {
              isBooked: false,
            });
          } catch (e) {
            console.error(
              "Failed to release schedule for appt",
              appointmentId,
              e
            );
          }
        }
      } catch (e) {
        console.error("Error handling expired invoice", (inv as any)._id, e);
      }
    }
  } catch (e) {
    console.error("markExpiredOnce error:", e);
  }
}

export function startExpiredInvoiceMonitor(): void {
  if (timer) return; // already running
  // run once immediately
  markExpiredOnce().catch((e) => console.error(e));
  timer = setInterval(() => {
    markExpiredOnce().catch((e) => console.error(e));
  }, POLL_INTERVAL_MS);
  console.log("Started expired-invoice monitor (polling every 60s)");
}

export function stopExpiredInvoiceMonitor(): void {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
  console.log("Stopped expired-invoice monitor");
}

export default {
  startExpiredInvoiceMonitor,
  stopExpiredInvoiceMonitor,
};
