import { Request, Response } from "express";
import Appointment from "../models/Appointment";
import DoctorSchedule from "../../doctor/models/DoctorSchedule";
import { AppointmentStatus } from "../types";

// Patient: Tạo lịch hẹn mới
export const createAppointment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { patientId, doctorId, scheduleId, symptoms, note } = req.body as {
      patientId: string;
      doctorId: string;
      scheduleId: string;
      symptoms?: string;
      note?: string;
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
      // any status except cancelled
      status: { $ne: "cancelled" },
    })
      .populate({ path: "scheduleId", select: "date" })
      .lean();
    if (
      (sameDay as any)?.scheduleId &&
      (sameDay as any).scheduleId.date === day
    ) {
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

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      scheduleId,
      status: "pending",
      symptoms,
      note,
    });

    schedule.isBooked = true;
    await schedule.save();

    res.status(201).json(appointment);
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

    const appointments = await Appointment.find({ patientId })
      .populate({
        path: "doctorId",
        select: "name specialty workplace",
        model: "Doctor",
      })
      .populate({
        path: "scheduleId",
        model: "DoctorSchedule",
      })
      .sort({ createdAt: -1 })
      .lean();

    console.log("API - Found appointments:", appointments.length);

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
      status: { $in: ["done", "cancelled"] as AppointmentStatus[] },
    })
      .populate("doctorId", "name specialty workplace")
      .populate("scheduleId")
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

    if (appointment.status === "done") {
      res.status(400).json({ message: "Không thể hủy lịch hẹn đã hoàn thành" });
      return;
    }

    appointment.status = "cancelled";
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

    if (appointment.status !== "pending") {
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
