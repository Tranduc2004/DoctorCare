import { Request, Response } from "express";
import Appointment from "../../patient/models/Appointment";
import { AppointmentStatus } from "../../patient/types";

console.log("Appointment model imported successfully");

// Doctor: Lấy lịch hẹn của bác sĩ
export const getDoctorAppointments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { doctorId } = req.query as { doctorId?: string };

    if (!doctorId) {
      res.status(400).json({ message: "Thiếu doctorId" });
      return;
    }

    console.log("Fetching appointments for doctorId:", doctorId);

    // Check if there are any appointments at all
    const allAppointments = await Appointment.find({}).lean();
    console.log("Total appointments in database:", allAppointments.length);

    // First, try without populate to see if basic query works
    const basicList = await Appointment.find({ doctorId }).lean();
    console.log("Basic appointments found for doctorId:", basicList.length);

    // Then try with populate
    const list = await Appointment.find({ doctorId })
      .populate({
        path: "patientId",
        select: "name email phone",
        model: "Patient",
      })
      .populate({
        path: "scheduleId",
        model: "DoctorSchedule",
      })
      .sort({ createdAt: -1 })
      .lean();

    console.log("Found appointments with populate:", list.length);

    // Return the populated data
    res.json(list);
  } catch (error) {
    console.error("Error in getDoctorAppointments:", error);
    res.status(500).json({
      message: "Lỗi lấy lịch hẹn của bác sĩ",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Doctor: Cập nhật trạng thái lịch hẹn
export const updateAppointmentStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { status, doctorId } = req.body as {
      status: AppointmentStatus;
      doctorId: string;
    };

    const appointment = await Appointment.findOne({ _id: id, doctorId });
    if (!appointment) {
      res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
      return;
    }

    // Validate status transition
    const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["examining", "cancelled"],
      examining: ["prescribing", "cancelled"],
      prescribing: ["done", "cancelled"],
      done: [],
      cancelled: [],
    };

    const currentStatus = appointment.status;
    const allowedNextStatuses = validTransitions[currentStatus];

    if (!allowedNextStatuses.includes(status)) {
      res.status(400).json({
        message: `Không thể chuyển từ trạng thái ${currentStatus} sang ${status}`,
        allowedTransitions: allowedNextStatuses,
      });
      return;
    }

    appointment.status = status;
    await appointment.save();

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật lịch hẹn", error });
  }
};

// Doctor: Lấy lịch hẹn theo ngày
export const getAppointmentsByDate = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { doctorId, date } = req.query as {
      doctorId?: string;
      date?: string;
    };

    if (!doctorId || !date) {
      res.status(400).json({ message: "Thiếu doctorId hoặc date" });
      return;
    }

    const appointments = await Appointment.find({ doctorId })
      .populate("patientId", "name email phone")
      .populate("scheduleId")
      .populate({
        path: "scheduleId",
        match: { date: date },
      })
      .lean()
      .then((appointments) => appointments.filter((apt) => apt.scheduleId))
      .then((appointments) =>
        appointments.sort((a, b) => {
          const aTime = (a.scheduleId as any)?.startTime || "";
          const bTime = (b.scheduleId as any)?.startTime || "";
          return aTime.localeCompare(bTime);
        })
      );

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy lịch hẹn theo ngày", error });
  }
};

// Doctor: Lấy thống kê lịch hẹn
export const getAppointmentStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { doctorId } = req.query as { doctorId?: string };

    if (!doctorId) {
      res.status(400).json({ message: "Thiếu doctorId" });
      return;
    }

    const total = await Appointment.countDocuments({ doctorId });
    const pending = await Appointment.countDocuments({
      doctorId,
      status: "pending",
    });
    const confirmed = await Appointment.countDocuments({
      doctorId,
      status: "confirmed",
    });
    const examining = await Appointment.countDocuments({
      doctorId,
      status: "examining",
    });
    const prescribing = await Appointment.countDocuments({
      doctorId,
      status: "prescribing",
    });
    const completed = await Appointment.countDocuments({
      doctorId,
      status: "done",
    });
    const cancelled = await Appointment.countDocuments({
      doctorId,
      status: "cancelled",
    });

    res.json({
      total,
      pending,
      confirmed,
      examining,
      prescribing,
      completed,
      cancelled,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy thống kê lịch hẹn", error });
  }
};
