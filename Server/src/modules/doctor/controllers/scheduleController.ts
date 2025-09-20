import { Request, Response } from "express";
import DoctorSchedule from "../models/DoctorSchedule";

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map((x) => parseInt(x, 10));
  return h * 60 + m;
}

function toTime(mins: number): string {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

// Doctor: Tạo lịch làm việc mới
export const createSchedule = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { doctorId, date, startTime, endTime } = req.body as {
      doctorId?: string;
      date?: string;
      startTime?: string;
      endTime?: string;
    };

    if (!doctorId || !date || !startTime || !endTime) {
      res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
      return;
    }

    // If shift longer than 60 minutes, split into 60-minute slots
    const startM = toMinutes(startTime);
    const endM = toMinutes(endTime);
    const SLOTP = 60;
    const slots: Array<{ start: string; end: string }> = [];
    for (let s = startM; s < endM; s += SLOTP) {
      const e = Math.min(s + SLOTP, endM);
      if (e - s <= 0) continue;
      slots.push({ start: toTime(s), end: toTime(e) });
    }

    // Avoid duplicates: skip if an identical doc exists
    const created: any[] = [];
    for (const sl of slots) {
      const exists = await DoctorSchedule.findOne({
        doctorId,
        date,
        startTime: sl.start,
        endTime: sl.end,
      }).lean();
      if (exists) continue;
      const doc = await DoctorSchedule.create({
        doctorId,
        date,
        startTime: sl.start,
        endTime: sl.end,
      });
      created.push(doc);
    }

    res
      .status(201)
      .json(created.length ? created : { message: "No new slots" });
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

    // Normalize legacy long shifts into 60-minute slots (best-effort)
    const legacy = await DoctorSchedule.find({
      doctorId,
      status: "accepted",
      isBooked: false,
    })
      .sort({ date: 1, startTime: 1 })
      .lean();

    const toMinutes = (t: string) => {
      const [h, m] = t.split(":").map((x) => parseInt(x, 10));
      return h * 60 + m;
    };
    const toTime = (mins: number) => {
      const h = Math.floor(mins / 60)
        .toString()
        .padStart(2, "0");
      const m = (mins % 60).toString().padStart(2, "0");
      return `${h}:${m}`;
    };
    for (const it of legacy) {
      const dur =
        toMinutes((it as any).endTime) - toMinutes((it as any).startTime);
      if (dur > 60) {
        const startM = toMinutes((it as any).startTime);
        const endM = toMinutes((it as any).endTime);
        for (let s = startM; s < endM; s += 60) {
          const e = Math.min(s + 60, endM);
          if (e - s <= 0) continue;
          const st = toTime(s);
          const et = toTime(e);
          const exists = await DoctorSchedule.findOne({
            doctorId,
            date: (it as any).date,
            startTime: st,
            endTime: et,
          }).lean();
          if (!exists) {
            await DoctorSchedule.create({
              doctorId,
              date: (it as any).date,
              startTime: st,
              endTime: et,
              status: "accepted",
            });
          }
        }
        await DoctorSchedule.findByIdAndDelete((it as any)._id);
      }
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

    // Normalize legacy long shifts into 60-minute slots (best-effort)
    const legacy = await DoctorSchedule.find({
      doctorId,
      status: "accepted",
      isBooked: false,
    })
      .sort({ date: 1, startTime: 1 })
      .lean();

    const toMinutes = (t: string) => {
      const [h, m] = t.split(":").map((x) => parseInt(x, 10));
      return h * 60 + m;
    };
    const toTime = (mins: number) => {
      const h = Math.floor(mins / 60)
        .toString()
        .padStart(2, "0");
      const m = (mins % 60).toString().padStart(2, "0");
      return `${h}:${m}`;
    };
    for (const it of legacy) {
      const dur =
        toMinutes((it as any).endTime) - toMinutes((it as any).startTime);
      if (dur > 60) {
        const startM = toMinutes((it as any).startTime);
        const endM = toMinutes((it as any).endTime);
        for (let s = startM; s < endM; s += 60) {
          const e = Math.min(s + 60, endM);
          if (e - s <= 0) continue;
          const st = toTime(s);
          const et = toTime(e);
          const exists = await DoctorSchedule.findOne({
            doctorId,
            date: (it as any).date,
            startTime: st,
            endTime: et,
          }).lean();
          if (!exists) {
            await DoctorSchedule.create({
              doctorId,
              date: (it as any).date,
              startTime: st,
              endTime: et,
              status: "accepted",
            });
          }
        }
        await DoctorSchedule.findByIdAndDelete((it as any)._id);
      }
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
