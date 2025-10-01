import { Request, Response } from "express";
import Appointment from "../models/Appointment";
import { createNotification } from "../../../shared/services/notificationService";
import DoctorSchedule from "../../doctor/models/DoctorSchedule";
import { AppointmentStatus } from "../../../shared/types/appointment";
import { PAYMENT_HOLD_MS } from "../../../shared/constants/payment";
import mongoose from "mongoose";

// Patient: Tạo lịch hẹn mới
export const createAppointment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      patientId,
      doctorId,
      scheduleId,
      symptoms,
      note,
      appointmentTime,
      mode,
      patientInfo,
    } = req.body as {
      patientId: string;
      doctorId: string;
      scheduleId: string;
      symptoms?: string;
      note?: string;
      appointmentTime?: string;
      mode?: "online" | "offline";
      patientInfo?: {
        name?: string;
        phone?: string;
        email?: string;
      };
    };

    if (!patientId || !doctorId || !scheduleId) {
      res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
      return;
    }

    const schedule = await DoctorSchedule.findById(scheduleId);
    if (!schedule || String(schedule.doctorId) !== String(doctorId)) {
      res.status(404).json({ message: "Không tìm thấy lịch" });
      return;
    }

    if (schedule.isBooked) {
      res.status(400).json({ message: "Khung giờ đã được đặt" });
      return;
    }

    // Enforce: one appointment per patient per day
    const day = schedule.date; // already YYYY-MM-DD
    const sameDay = await Appointment.findOne({
      patientId,
      appointmentDate: day,
      // any status except cancelled
      status: { $nin: [AppointmentStatus.CANCELLED, AppointmentStatus.CLOSED] },
    });
    if (sameDay) {
      res.status(400).json({ message: "Mỗi ngày chỉ được đặt 1 lịch" });
      return;
    }

    // Optional: one per specialty/day (if doctor has specialty)
    // We check other appointments this day whose doctor shares same specialty
    // Note: best-effort to avoid extra joins if model differs
    const Doctor = require("../../doctor/models/Doctor").default;
    let specId: string | undefined;
    try {
      const doc = await Doctor.findById(doctorId).select("specialty").lean();
      const anySpec =
        (doc as any)?.specialty?.toString?.() ?? (doc as any)?.specialty;
      if (anySpec) specId = String(anySpec);
    } catch {}
    if (specId) {
      const sameDayAppointments = await Appointment.find({
        patientId,
        status: { $ne: "cancelled" },
      })
        .populate({ path: "scheduleId", select: "date" })
        .populate({ path: "doctorId", select: "specialty" })
        .lean();
      const hasSameSpecSameDay = (sameDayAppointments || []).some((a: any) => {
        const d = a.scheduleId?.date;
        const sp = a.doctorId?.specialty?.toString?.() ?? a.doctorId?.specialty;
        return d === day && sp && specId && sp === specId;
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
    const holdExpiresAt = new Date(Date.now() + PAYMENT_HOLD_MS);

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      scheduleId,
      status: AppointmentStatus.AWAIT_PAYMENT,
      holdExpiresAt,
      mode: mode === "online" ? "online" : "offline",
      symptoms,
      note,
      appointmentTime: appointmentTime || schedule.startTime,
      appointmentDate: schedule.date,
      patientInfo: patientInfo || undefined,
    });

    schedule.isBooked = true;
    await schedule.save();

    // Notify patient and doctor about the new booking (best-effort)
    try {
      await createNotification({
        userId: String(patientId),
        type: "appointment",
        title: "Đặt lịch thành công",
        body: `Bạn đã đặt lịch với bác sĩ. Ngày ${schedule.date} - ${appointment.appointmentTime}`,
      } as any);
    } catch (err) {
      console.error("Notify patient about booking failed:", err);
    }
    try {
      await createNotification({
        userId: String(doctorId),
        type: "appointment",
        title: "Bạn có lịch hẹn mới",
        body: `Bệnh nhân đã đặt lịch: ${schedule.date} - ${appointment.appointmentTime}`,
      } as any);
    } catch (err) {
      console.error("Notify doctor about booking failed:", err);
    }

    // Return hold info so client can show countdown and proceed to payment
    res.status(201).json({
      success: true,
      data: appointment,
      message: "Đặt lịch tạm giữ, chờ thanh toán",
      holdExpiresAt,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi tạo lịch hẹn", error });
  }
};

// Patient: Lấy lịch hẹn của bệnh nhân
export const getPatientAppointments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { patientId } = req.query;

    if (!patientId) {
      res.status(400).json({ message: "Missing patientId" });
      return;
    }

    // First, release any expired holds found for this patient (best-effort).
    const now = new Date();
    const expiredHolds = await Appointment.find({
      patientId,
      status: AppointmentStatus.AWAIT_PAYMENT,
      holdExpiresAt: { $lte: now },
    });
    for (const h of expiredHolds) {
      try {
        // mark as overdue for payment so UI can show proper state
        h.status = AppointmentStatus.PAYMENT_OVERDUE;
        await h.save();
        if (h.scheduleId) {
          await DoctorSchedule.findByIdAndUpdate(h.scheduleId as any, {
            isBooked: false,
          });
        }
      } catch (e) {
        console.error("Failed to release expired hold", h._id, e);
      }
    }

    const appointments = await Appointment.find({ patientId })
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
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching appointments",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Patient: Lấy lịch sử lịch hẹn (đã hoàn thành hoặc đã hủy)
export const getAppointmentHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { patientId } = req.query as { patientId?: string };
    if (!patientId) {
      res.status(400).json({ message: "Thiếu patientId" });
      return;
    }

    const list = await Appointment.find({
      patientId,
      status: {
        $in: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED],
      },
    })
      .populate("patientId", "name email phone")
      .populate("doctorId", "name specialty workplace")
      .populate("scheduleId")
      .populate({ path: "newScheduleId", model: "DoctorSchedule" })
      .sort({ updatedAt: -1 })
      .lean();

    res.json(list);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy lịch sử lịch hẹn", error });
  }
};

// Patient: Hủy lịch hẹn
export const cancelAppointment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { patientId } = req.body as { patientId: string };

    const appointment = await Appointment.findOne({ _id: id, patientId });
    if (!appointment) {
      res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
      return;
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
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
        const { force } = req.body as { force?: boolean };
        if (!force) {
          res
            .status(400)
            .json({ message: "Không thể hủy trong vòng 24 giờ trước giờ hẹn" });
          return;
        }
      }
    } catch (e) {
      // if parsing fails, fall back to previous behavior
    }

    appointment.status = AppointmentStatus.CANCELLED;
    await appointment.save();

    // Cập nhật trạng thái lịch làm việc
    if (appointment.scheduleId) {
      await DoctorSchedule.findByIdAndUpdate(appointment.scheduleId, {
        isBooked: false,
      });
    }

    res.json({ message: "Hủy lịch hẹn thành công", appointment });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hủy lịch hẹn", error });
  }
};

// Patient: Cập nhật triệu chứng
export const updateSymptoms = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { patientId, symptoms } = req.body as {
      patientId: string;
      symptoms: string;
    };

    const appointment = await Appointment.findOne({ _id: id, patientId });
    if (!appointment) {
      res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
      return;
    }

    if (appointment.status !== AppointmentStatus.BOOKED) {
      res
        .status(400)
        .json({ message: "Chỉ có thể cập nhật lịch hẹn đang chờ" });
      return;
    }

    appointment.symptoms = symptoms;
    await appointment.save();

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật triệu chứng", error });
  }
};

// Doctor: request extension for a current appointment
export const extendAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { minutes, doctorId, reason } = req.body as {
      minutes: number;
      doctorId: string;
      reason?: string;
    };

    if (!minutes || !doctorId) {
      return res.status(400).json({ message: "Missing input" });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) return res.status(404).json({ message: "Not found" });

    // Only allow extension while in consultation or confirmed
    if (
      ![AppointmentStatus.CONFIRMED, AppointmentStatus.IN_CONSULT].includes(
        appointment.status
      )
    ) {
      return res
        .status(400)
        .json({ message: "Cannot request extension for this appointment" });
    }

    // Find the next appointment for same doctor on same date/time ordering
    const next = await Appointment.findOne({
      doctorId: appointment.doctorId,
      appointmentDate: appointment.appointmentDate,
      _id: { $ne: appointment._id },
      status: { $nin: [AppointmentStatus.CANCELLED] },
    })
      .where("createdAt")
      .gt((appointment as any).createdAt)
      .sort({ createdAt: 1 })
      .exec();

    const now = new Date();

    // Build extension object
    const ext: any = {
      minutes,
      status: "consent_pending",
      requestedBy: new mongoose.Types.ObjectId(doctorId),
      requestedAt: now,
      reason: reason || "",
      consentRequestedAt: now,
      consentExpiresAt: new Date(now.getTime() + 3 * 60 * 1000), // 3 min
    };

    if (next) ext.targetNextApptId = next._id;

    appointment.extension = ext;
    await appointment.save();

    // Notify next patient if exists
    if (next) {
      try {
        await createNotification({
          userId: String(next.patientId),
          type: "appointment",
          title: "Yêu cầu gia hạn từ bác sĩ",
          body: `Bác sĩ muốn kéo dài buổi khám thêm ${minutes} phút. Bạn có đồng ý chờ?`,
          meta: { appointmentId: next._id, fromAppointmentId: appointment._id },
        } as any);
      } catch (e) {
        console.error("Notify next patient failed", e);
      }
    }

    res.json({
      message: "Extension requested",
      extension: appointment.extension,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Error requesting extension", error: String(err) });
  }
};

// Patient: respond to extension consent request
export const extensionConsent = async (req: Request, res: Response) => {
  try {
    const { nextId } = req.params as { nextId: string };
    const { response, patientId } = req.body as {
      response: "accept" | "decline";
      patientId: string;
    };

    const next = await Appointment.findById(nextId);
    if (!next)
      return res.status(404).json({ message: "Next appointment not found" });

    // find the appointment that requested consent and points to this nextId
    const requester = await Appointment.findOne({
      "extension.targetNextApptId": next._id,
      "extension.status": "consent_pending",
    });
    if (!requester)
      return res
        .status(404)
        .json({ message: "No pending extension request found" });

    const now = new Date();
    if (
      (requester as any).extension &&
      (requester as any).extension.consentExpiresAt &&
      (requester as any).extension.consentExpiresAt < now
    ) {
      (requester as any).extension.status = "timeout";
      await requester.save();
      return res.status(410).json({ message: "Consent expired" });
    }

    if (String(next.patientId) !== String(patientId)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (response === "accept") {
      (requester as any).extension.status = "accepted";
      (requester as any).extension.consentBy = new mongoose.Types.ObjectId(
        patientId
      );
      (requester as any).extension.consentResponse = "accepted";
      (requester as any).extension.appliedAt = now;
      await requester.save();

      // Shift next appointment by minutes
      const minutes = Number((requester as any).extension.minutes || 0);
      if (minutes > 0) {
        // naive shift: update appointment time fields if possible
        // For MVP, keep appointmentDate same and just append an offset in patient-visible ETA
        // TODO: implement robust time shifting and conflict checks
        next.note =
          (next.note || "") +
          `\n[Shifted by ${minutes} minutes due to previous appointment]`;
        await next.save();
      }

      try {
        await createNotification({
          userId: String(requester.doctorId),
          type: "appointment",
          title: "Bệnh nhân đồng ý gia hạn",
          body: `Bệnh nhân đã đồng ý chờ thêm ${
            (requester as any).extension.minutes
          } phút`,
        } as any);
      } catch (e) {
        console.error("Notify doctor failed", e);
      }

      return res.json({
        message: "Accepted",
        extension: (requester as any).extension,
      });
    } else {
      (requester as any).extension.status = "declined";
      (requester as any).extension.consentResponse = "declined";
      await requester.save();
      try {
        await createNotification({
          userId: String(requester.doctorId),
          type: "appointment",
          title: "Bệnh nhân từ chối gia hạn",
          body: `Bệnh nhân không đồng ý chờ. Vui lòng chọn phương án khác.`,
        } as any);
      } catch (e) {
        console.error("Notify doctor failed", e);
      }
      return res.json({
        message: "Declined",
        extension: (requester as any).extension,
      });
    }
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Error handling consent", error: String(err) });
  }
};

// Patient/Doctor check-in endpoint
export const checkinAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { by } = req.body as { by: "patient" | "doctor" };

    if (!id || !by) {
      return res
        .status(400)
        .json({ message: "Missing appointment id or 'by'" });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) return res.status(404).json({ message: "Not found" });

    const now = new Date();
    appointment.meta = appointment.meta || {};
    if (by === "patient") {
      appointment.meta.patientCheckedInAt = now;
      // optional: when patient checks in, notify doctor
      try {
        await createNotification({
          userId: String(appointment.doctorId),
          type: "appointment",
          title: "Bệnh nhân đã đến",
          body: `Bệnh nhân đã check-in cho lịch ${appointment._id}`,
        } as any);
      } catch (e) {
        console.error("Notify doctor on patient check-in failed", e);
      }
    } else {
      appointment.meta.doctorCheckedInAt = now;
      // optional: when doctor checks in, notify patient
      try {
        await createNotification({
          userId: String(appointment.patientId),
          type: "appointment",
          title: "Bác sĩ sẵn sàng khám",
          body: `Bác sĩ đã sẵn sàng cho lịch ${appointment._id}`,
        } as any);
      } catch (e) {
        console.error("Notify patient on doctor check-in failed", e);
      }
    }

    await appointment.save();

    res.json({ message: "Checked in", appointment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error on checkin", error: String(err) });
  }
};

// Patient: propose reschedule (send array of schedule ids or free-text slots)
export const reschedulePropose = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { patientId, proposedSlots, message } = req.body as {
      patientId: string;
      proposedSlots?: string[]; // schedule ids or ISO datetimes
      message?: string;
    };

    if (!id || !patientId) {
      return res
        .status(400)
        .json({ message: "Missing appointment id or patientId" });
    }

    const appt = await Appointment.findOne({ _id: id, patientId });
    if (!appt)
      return res.status(404).json({ message: "Appointment not found" });

    // Do not allow proposing reschedule once consultation started
    if (appt.status === AppointmentStatus.IN_CONSULT) {
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
    } as any;

    await appt.save();

    // Notify doctor
    try {
      await createNotification({
        userId: String(appt.doctorId),
        type: "appointment",
        title: "Bệnh nhân đề nghị đổi lịch",
        body: `Bệnh nhân đã đề nghị đổi lịch cho lịch ${String(appt._id)}.`,
        meta: { appointmentId: appt._id },
      } as any);
    } catch (e) {
      console.error("Notify doctor about reschedule propose failed", e);
    }

    res.json({ message: "Reschedule proposed", appointment: appt });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Error proposing reschedule", error: String(err) });
  }
};

// Patient: accept a reschedule (either doctor's proposed newScheduleId or a selected slot)
export const rescheduleAccept = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { patientId, slotId, acceptDoctorProposal } = req.body as {
      patientId: string;
      slotId?: string; // chosen schedule id
      acceptDoctorProposal?: boolean;
    };

    if (!id || !patientId)
      return res.status(400).json({ message: "Missing input" });

    const appt = await Appointment.findOne({ _id: id, patientId });
    if (!appt)
      return res.status(404).json({ message: "Appointment not found" });

    if (!appt.meta?.reschedule) {
      return res.status(400).json({ message: "No reschedule pending" });
    }

    // If doctor proposed a newScheduleId (stored in appointment.newScheduleId), accept it
    if (acceptDoctorProposal && appt.newScheduleId) {
      // move schedule booking
      const oldScheduleId = appt.scheduleId;
      appt.scheduleId = appt.newScheduleId as any;
      appt.newScheduleId = undefined;
      appt.status = AppointmentStatus.BOOKED;
      (appt.meta.reschedule as any).acceptedAt = new Date();
      (appt.meta.reschedule as any).acceptedBy = "patient";
      await appt.save();

      // update doctor schedule flags
      try {
        if (oldScheduleId) {
          await DoctorSchedule.findByIdAndUpdate(oldScheduleId, {
            isBooked: false,
          });
        }
        if (appt.scheduleId) {
          await DoctorSchedule.findByIdAndUpdate(appt.scheduleId, {
            isBooked: true,
          });
        }
      } catch (e) {
        console.error("Failed to update schedule flags", e);
      }

      try {
        await createNotification({
          userId: String(appt.doctorId),
          type: "appointment",
          title: "Bệnh nhân xác nhận đổi lịch",
          body: `Bệnh nhân đã xác nhận lịch mới cho ${String(appt._id)}`,
          meta: { appointmentId: appt._id },
        } as any);
      } catch (e) {
        console.error("Notify doctor failed", e);
      }

      return res.json({
        message: "Accepted doctor's reschedule",
        appointment: appt,
      });
    }

    // Otherwise if patient selected a slotId, attempt to move
    if (slotId) {
      const newSchedule = await DoctorSchedule.findOne({
        _id: slotId,
        isBooked: false,
      });
      if (!newSchedule)
        return res.status(404).json({ message: "Selected slot not available" });

      const oldScheduleId = appt.scheduleId;
      appt.scheduleId = newSchedule._id as any;
      appt.status = AppointmentStatus.BOOKED;
      (appt.meta.reschedule as any).acceptedAt = new Date();
      (appt.meta.reschedule as any).acceptedBy = "patient";
      await appt.save();

      try {
        if (oldScheduleId) {
          await DoctorSchedule.findByIdAndUpdate(oldScheduleId, {
            isBooked: false,
          });
        }
        await DoctorSchedule.findByIdAndUpdate(newSchedule._id, {
          isBooked: true,
        });
      } catch (e) {
        console.error("Failed to update schedule flags", e);
      }

      try {
        await createNotification({
          userId: String(appt.doctorId),
          type: "appointment",
          title: "Bệnh nhân xác nhận đổi lịch",
          body: `Bệnh nhân đã chọn lịch mới cho ${String(appt._id)}`,
          meta: { appointmentId: appt._id },
        } as any);
      } catch (e) {
        console.error("Notify doctor failed", e);
      }

      return res.json({ message: "Reschedule accepted", appointment: appt });
    }

    return res.status(400).json({ message: "No action taken" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Error accepting reschedule", error: String(err) });
  }
};
