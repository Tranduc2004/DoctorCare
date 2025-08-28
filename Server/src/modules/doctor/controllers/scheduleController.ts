import { Request, Response } from "express";
import DoctorSchedule from "../models/DoctorSchedule";

// Doctor: Tạo lịch làm việc mới
export const createSchedule = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { doctorId, date, startTime, endTime } = req.body;

    if (!doctorId || !date || !startTime || !endTime) {
      res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
      return;
    }

    const schedule = await DoctorSchedule.create({
      doctorId,
      date,
      startTime,
      endTime,
    });

    res.status(201).json(schedule);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tạo lịch", error });
  }
};

// Doctor: Lấy lịch làm việc của bác sĩ (cho bệnh nhân đặt lịch)
export const getDoctorSchedules = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { doctorId } = req.query as { doctorId?: string };

    if (!doctorId) {
      res.status(400).json({ message: "Thiếu doctorId" });
      return;
    }

    const schedules = await DoctorSchedule.find({
      doctorId,
      status: "accepted",
      isBooked: false,
    })
      .sort({ date: 1, startTime: 1 })
      .lean();

    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy lịch", error });
  }
};

// Lấy lịch làm việc của bác sĩ cụ thể (dùng path parameter)
export const getDoctorSchedulesById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { doctorId } = req.params as { doctorId: string };

    const schedules = await DoctorSchedule.find({
      doctorId,
      status: "accepted",
      isBooked: false,
    })
      .sort({ date: 1, startTime: 1 })
      .lean();

    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy lịch", error });
  }
};

// Doctor: Lấy tất cả lịch làm việc của bác sĩ (bao gồm đã đặt)
export const getMySchedules = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { doctorId } = req.query as { doctorId?: string };
    const schedules = await DoctorSchedule.find({ doctorId })
      .sort({ date: 1, startTime: 1 })
      .lean();

    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy lịch của tôi", error });
  }
};

// Doctor: Chấp nhận lịch làm việc
export const acceptSchedule = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { doctorId } = req.body as { doctorId: string };

    const schedule = await DoctorSchedule.findOne({
      _id: id,
      doctorId,
      status: "pending",
    });

    if (!schedule) {
      res
        .status(404)
        .json({ message: "Không tìm thấy lịch làm việc chờ xác nhận" });
      return;
    }

    schedule.status = "accepted";
    await schedule.save();

    res.json({ message: "Đã chấp nhận lịch làm việc", schedule });
  } catch (error) {
    res.status(500).json({ message: "Lỗi chấp nhận lịch", error });
  }
};

// Doctor: Từ chối lịch làm việc
export const rejectSchedule = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { doctorId, rejectionReason } = req.body as {
      doctorId: string;
      rejectionReason: string;
    };

    if (!rejectionReason) {
      res.status(400).json({ message: "Vui lòng cung cấp lý do từ chối" });
      return;
    }

    const schedule = await DoctorSchedule.findOne({
      _id: id,
      doctorId,
      status: "pending",
    });

    if (!schedule) {
      res
        .status(404)
        .json({ message: "Không tìm thấy lịch làm việc chờ xác nhận" });
      return;
    }

    schedule.status = "rejected";
    schedule.rejectionReason = rejectionReason;
    await schedule.save();

    res.json({ message: "Đã từ chối lịch làm việc", schedule });
  } catch (error) {
    res.status(500).json({ message: "Lỗi từ chối lịch", error });
  }
};

// Doctor: Báo bận với lý do
export const reportBusy = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { doctorId, busyReason } = req.body as {
      doctorId: string;
      busyReason: string;
    };

    if (!busyReason) {
      res.status(400).json({ message: "Vui lòng cung cấp lý do bận" });
      return;
    }

    const schedule = await DoctorSchedule.findOne({
      _id: id,
      doctorId,
      status: "pending",
    });

    if (!schedule) {
      res
        .status(404)
        .json({ message: "Không tìm thấy lịch làm việc chờ xác nhận" });
      return;
    }

    schedule.status = "busy";
    schedule.busyReason = busyReason;
    await schedule.save();

    res.json({ message: "Đã báo bận lịch làm việc", schedule });
  } catch (error) {
    res.status(500).json({ message: "Lỗi báo bận lịch", error });
  }
};

// Doctor: Cập nhật lịch làm việc
export const updateSchedule = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { doctorId } = req.body as { doctorId: string };
    const update = req.body;

    // Kiểm tra xem lịch có thuộc về bác sĩ này không
    const existingSchedule = await DoctorSchedule.findOne({
      _id: id,
      doctorId,
    });
    if (!existingSchedule) {
      res.status(404).json({ message: "Không tìm thấy lịch làm việc" });
      return;
    }

    // Không cho phép cập nhật nếu lịch đã được đặt
    if (existingSchedule.isBooked) {
      res.status(400).json({ message: "Không thể cập nhật lịch đã được đặt" });
      return;
    }

    const schedule = await DoctorSchedule.findByIdAndUpdate(id, update, {
      new: true,
    });

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật lịch", error });
  }
};

// Doctor: Xóa lịch làm việc
export const deleteSchedule = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { doctorId } = req.body as { doctorId: string };

    const schedule = await DoctorSchedule.findOne({ _id: id, doctorId });
    if (!schedule) {
      res.status(404).json({ message: "Không tìm thấy lịch làm việc" });
      return;
    }

    if (schedule.isBooked) {
      res.status(400).json({ message: "Không thể xóa lịch đã được đặt" });
      return;
    }

    await DoctorSchedule.findByIdAndDelete(id);
    res.json({ message: "Xóa lịch làm việc thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa lịch làm việc", error });
  }
};

// Doctor: Lấy thống kê lịch làm việc
export const getScheduleStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { doctorId } = req.query as { doctorId?: string };

    if (!doctorId) {
      res.status(400).json({ message: "Thiếu doctorId" });
      return;
    }

    const total = await DoctorSchedule.countDocuments({ doctorId });
    const pending = await DoctorSchedule.countDocuments({
      doctorId,
      status: "pending",
    });
    const accepted = await DoctorSchedule.countDocuments({
      doctorId,
      status: "accepted",
    });
    const rejected = await DoctorSchedule.countDocuments({
      doctorId,
      status: "rejected",
    });
    const busy = await DoctorSchedule.countDocuments({
      doctorId,
      status: "busy",
    });

    res.json({
      total,
      pending,
      accepted,
      rejected,
      busy,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy thống kê lịch làm việc", error });
  }
};
