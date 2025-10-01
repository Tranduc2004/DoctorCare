import { Request, Response } from "express";
import Appointment from "../../patient/models/Appointment";
import { AppointmentStatus } from "../../../shared/types/appointment";
import { PAYMENT_HOLD_MS } from "../../../shared/constants/payment";
import { createNotification } from "../../../shared/services/notificationService";

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
      // include the proposed new schedule so clients can display doctor's suggestion
      .populate({
        path: "newScheduleId",
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
    // support both :id and :appointmentId route param names for robustness
    const appointmentId =
      (req.params as any).appointmentId || (req.params as any).id || "";
    const { status, doctorId } = req.body as {
      status: AppointmentStatus;
      doctorId: string;
    };

    // Validate required fields
    if (!appointmentId || !status || !doctorId) {
      res.status(400).json({
        message: "Thiếu thông tin bắt buộc",
        details: {
          appointmentId: !appointmentId ? "Thiếu ID lịch hẹn" : null,
          status: !status ? "Thiếu trạng thái mới" : null,
          doctorId: !doctorId ? "Thiếu ID bác sĩ" : null,
        },
      });
      return;
    }

    // Validate status is a valid enum value
    if (!Object.values(AppointmentStatus).includes(status)) {
      res.status(400).json({
        message: "Trạng thái không hợp lệ",
        validStatuses: Object.values(AppointmentStatus),
      });
      return;
    }

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId,
    });
    if (!appointment) {
      res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
      return;
    }

    // Validate status transition
    const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      [AppointmentStatus.BOOKED]: [
        AppointmentStatus.DOCTOR_APPROVED,
        AppointmentStatus.DOCTOR_REJECTED,
        AppointmentStatus.CANCELLED,
      ],
      [AppointmentStatus.DOCTOR_APPROVED]: [
        AppointmentStatus.AWAIT_PAYMENT,
        AppointmentStatus.CANCELLED,
      ],
      [AppointmentStatus.AWAIT_PAYMENT]: [
        AppointmentStatus.PAID,
        AppointmentStatus.PAYMENT_OVERDUE,
        AppointmentStatus.CANCELLED,
      ],
      [AppointmentStatus.PAID]: [
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.CANCELLED,
      ],
      [AppointmentStatus.CONFIRMED]: [
        AppointmentStatus.IN_CONSULT,
        AppointmentStatus.CANCELLED,
      ],
      [AppointmentStatus.IN_CONSULT]: [
        AppointmentStatus.PRESCRIPTION_ISSUED,
        AppointmentStatus.CANCELLED,
      ],
      [AppointmentStatus.PRESCRIPTION_ISSUED]: [
        AppointmentStatus.READY_TO_DISCHARGE,
        AppointmentStatus.CANCELLED,
      ],
      [AppointmentStatus.READY_TO_DISCHARGE]: [
        AppointmentStatus.COMPLETED,
        AppointmentStatus.CANCELLED,
      ],
      [AppointmentStatus.COMPLETED]: [],
      [AppointmentStatus.CANCELLED]: [],
      [AppointmentStatus.CLOSED]: [],
      [AppointmentStatus.DOCTOR_REJECTED]: [AppointmentStatus.CLOSED],
      [AppointmentStatus.DOCTOR_RESCHEDULE]: [
        AppointmentStatus.BOOKED,
        AppointmentStatus.CANCELLED,
      ],
      [AppointmentStatus.PAYMENT_OVERDUE]: [AppointmentStatus.CLOSED],
    };

    const currentStatus = appointment.status as AppointmentStatus;
    console.log("Current status:", currentStatus);
    console.log("Requested status:", status);

    // Ensure current status is valid
    if (!Object.values(AppointmentStatus).includes(currentStatus)) {
      res.status(400).json({
        message: "Trạng thái hiện tại không hợp lệ",
        currentStatus,
        validStatuses: Object.values(AppointmentStatus),
      });
      return;
    }

    const allowedNextStatuses = validTransitions[currentStatus];
    if (!allowedNextStatuses) {
      console.error("No transitions defined for status:", currentStatus);
      res.status(400).json({
        message: `Không có quy tắc chuyển trạng thái cho ${currentStatus}`,
        currentStatus,
        requestedStatus: status,
      });
      return;
    }

    if (!allowedNextStatuses.includes(status)) {
      res.status(400).json({
        message: `Không thể chuyển từ trạng thái ${currentStatus} sang ${status}`,
        currentStatus,
        requestedStatus: status,
        allowedTransitions: allowedNextStatuses,
      });
      return;
    }

    // Update the appointment
    appointment.status = status;

    try {
      await appointment.save();

      // Tự động tạo hóa đơn tạm ứng khi bác sĩ chấp nhận
      if (status === AppointmentStatus.DOCTOR_APPROVED) {
        const Doctor = await import("../models/Doctor").then((m) => m.default);
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
          throw new Error("Không tìm thấy thông tin bác sĩ");
        }

        // Tạo hóa đơn tạm ứng
        const Invoice = await import("../../patient/models/Invoice").then(
          (m) => m.default
        );
        await Invoice.create({
          appointmentId: appointment._id,
          type: "consultation",
          items: [
            {
              type: "consultation_fee",
              description: "Phí khám cơ bản",
              amount: doctor.consultationFee || 0,
              insuranceCoverage: "no_coverage",
              insuranceAmount: 0,
              patientAmount: doctor.consultationFee || 0,
            },
          ],
          subtotal: doctor.consultationFee || 0,
          insuranceCoverage: 0,
          patientAmount: doctor.consultationFee || 0,
          status: "pending",
          dueDate: new Date(Date.now() + PAYMENT_HOLD_MS), // payment hold duration
        });

        // Cập nhật trạng thái appointment sang AWAIT_PAYMENT
        appointment.status = AppointmentStatus.AWAIT_PAYMENT;
        await appointment.save();
      }
    } catch (saveError) {
      console.error("Error saving appointment:", saveError);
      res.status(500).json({
        message: "Lỗi khi lưu cập nhật trạng thái",
        error:
          saveError instanceof Error ? saveError.message : String(saveError),
      });
      return;
    }

    // Free the slot when appointment gets cancelled
    if (
      (status === AppointmentStatus.CANCELLED ||
        status === AppointmentStatus.PAYMENT_OVERDUE) &&
      appointment.scheduleId
    ) {
      try {
        const DoctorSchedule = await import("../models/DoctorSchedule").then(
          (m) => m.default
        );
        await DoctorSchedule.findByIdAndUpdate(appointment.scheduleId, {
          isBooked: false,
        });
      } catch (scheduleError) {
        console.error("Error updating schedule:", scheduleError);
        // Don't fail the request if this fails, just log it
      }
    }

    // Notify patient (best-effort, non-blocking) about status changes
    try {
      const patientId = String(appointment.patientId);
      if (status === AppointmentStatus.DOCTOR_APPROVED) {
        await createNotification({
          userId: patientId,
          type: "appointment",
          title: "Bác sĩ đã xác nhận lịch hẹn",
          body: `Lịch hẹn của bạn đã được bác sĩ xác nhận.`,
        } as any);
      } else if (status === AppointmentStatus.DOCTOR_REJECTED) {
        await createNotification({
          userId: patientId,
          type: "appointment",
          title: "Lịch hẹn bị từ chối",
          body: `Bác sĩ đã từ chối lịch hẹn của bạn. Vui lòng kiểm tra chi tiết hoặc đặt lại lịch.`,
        } as any);
      } else if (status === AppointmentStatus.CANCELLED) {
        await createNotification({
          userId: patientId,
          type: "appointment",
          title: "Lịch hẹn đã bị hủy",
          body: `Lịch hẹn của bạn đã bị hủy. Nếu có thắc mắc, liên hệ phòng khám.`,
        } as any);
      } else if (status === AppointmentStatus.AWAIT_PAYMENT) {
        await createNotification({
          userId: patientId,
          type: "payment",
          title: "Yêu cầu thanh toán",
          body: `Vui lòng hoàn tất thanh toán để xác nhận lịch hẹn.`,
        } as any);
      } else if (status === AppointmentStatus.CONFIRMED) {
        await createNotification({
          userId: patientId,
          type: "appointment",
          title: "Lịch hẹn đã được xác nhận",
          body: `Bác sĩ đã xác nhận và lịch hẹn sẵn sàng.`,
        } as any);
      } else if (status === AppointmentStatus.IN_CONSULT) {
        await createNotification({
          userId: patientId,
          type: "appointment",
          title: "Bắt đầu khám",
          body: `Bác sĩ đã bắt đầu buổi khám của bạn.`,
        } as any);
      } else if (status === AppointmentStatus.PRESCRIPTION_ISSUED) {
        await createNotification({
          userId: patientId,
          type: "appointment",
          title: "Kê đơn/Hoàn tất khám",
          body: `Bác sĩ đã hoàn tất khám và kê đơn cho bạn. Vui lòng kiểm tra chi tiết.`,
        } as any);
      }
    } catch (notifyErr) {
      console.error("Notify patient about status change failed:", notifyErr);
    }

    res.json(appointment);
  } catch (error) {
    console.error("Error in updateAppointmentStatus:", error);
    res.status(500).json({
      message: "Lỗi cập nhật lịch hẹn",
      error: error instanceof Error ? error.message : String(error),
    });
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

    // Tìm tất cả appointments của doctor
    const appointments = await Appointment.find({ doctorId })
      .populate("patientId", "name email phone avatar")
      .populate("scheduleId")
      .lean();

    // Filter appointments theo ngày
    const filteredAppointments = appointments.filter((apt) => {
      if (!apt.scheduleId) {
        return false;
      }
      
      const schedule = apt.scheduleId as any;
      const scheduleDate = schedule?.date;
      
      return scheduleDate === date;
    });

    // Sort theo thời gian
    const sortedAppointments = filteredAppointments.sort((a, b) => {
      const aTime = (a.scheduleId as any)?.startTime || "";
      const bTime = (b.scheduleId as any)?.startTime || "";
      return aTime.localeCompare(bTime);
    });

    res.json({
      success: true,
      data: sortedAppointments,
      count: sortedAppointments.length
    });
  } catch (error) {
    console.error("Error in getAppointmentsByDate:", error);
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
    // Treat awaiting-payment holds as pending as well
    const pending = await Appointment.countDocuments({
      doctorId,
      status: {
        $in: [AppointmentStatus.BOOKED, AppointmentStatus.AWAIT_PAYMENT],
      },
    });
    const confirmed = await Appointment.countDocuments({
      doctorId,
      status: AppointmentStatus.CONFIRMED,
    });
    const examining = await Appointment.countDocuments({
      doctorId,
      status: AppointmentStatus.IN_CONSULT,
    });
    const prescribing = await Appointment.countDocuments({
      doctorId,
      status: AppointmentStatus.PRESCRIPTION_ISSUED,
    });
    const completed = await Appointment.countDocuments({
      doctorId,
      status: AppointmentStatus.COMPLETED,
    });
    const cancelled = await Appointment.countDocuments({
      doctorId,
      status: AppointmentStatus.CANCELLED,
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
