import { Request, Response, NextFunction, RequestHandler } from "express";
import Appointment from "../../patient/models/Appointment";
import DoctorSchedule from "../../doctor/models/DoctorSchedule";
import { AppointmentStatus } from "../../patient/types";

// Admin: Lấy tất cả lịch hẹn trong hệ thống
export const getAllAppointments: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const appointments = await Appointment.find()
      .populate("patientId", "name email phone")
      .populate("doctorId", "name specialty workplace")
      .populate("scheduleId")
      .sort({ createdAt: -1 })
      .lean();

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách lịch hẹn", error });
  }
};

// Admin: Cập nhật trạng thái lịch hẹn
export const updateAppointmentStatus: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: AppointmentStatus };

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!appointment) {
      res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
      return;
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật lịch hẹn", error });
  }
};

// Admin: Xóa lịch hẹn
export const deleteAppointment: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params as { id: string };

    const appointment = await Appointment.findByIdAndDelete(id);
    if (!appointment) {
      res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
      return;
    }

    // Cập nhật trạng thái lịch làm việc
    if (appointment.scheduleId) {
      await DoctorSchedule.findByIdAndUpdate(appointment.scheduleId, {
        isBooked: false,
      });
    }

    res.json({ message: "Xóa lịch hẹn thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa lịch hẹn", error });
  }
};

// Admin: Thống kê lịch hẹn
export const getAppointmentStats: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const total = await Appointment.countDocuments();
    const pending = await Appointment.countDocuments({ status: "pending" });
    const confirmed = await Appointment.countDocuments({ status: "confirmed" });
    const completed = await Appointment.countDocuments({ status: "done" });
    const cancelled = await Appointment.countDocuments({ status: "cancelled" });

    res.json({
      total,
      pending,
      confirmed,
      completed,
      cancelled,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy thống kê", error });
  }
};
