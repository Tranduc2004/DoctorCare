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
    const { patientId } = req.query as { patientId?: string };
    const list = await Appointment.find({ patientId })
      .populate("doctorId", "name specialty workplace")
      .populate("scheduleId")
      .sort({ createdAt: -1 })
      .lean();

    res.json(list);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy lịch hẹn", error });
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
