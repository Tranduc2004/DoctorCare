import { Request, Response } from "express";
import DoctorSchedule from "../../doctor/models/DoctorSchedule";
import Doctor from "../../doctor/models/Doctor";
import mongoose from "mongoose";

// Admin: Tạo 1 ca làm việc cho bác sĩ
export const adminCreateDoctorShift = async (
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

    const doctor = await Doctor.findById(doctorId).lean();
    if (!doctor) {
      res.status(404).json({ message: "Không tìm thấy bác sĩ" });
      return;
    }

    // Normalize inputs
    const normalizedDate = (date as string).includes("T")
      ? (date as string).split("T")[0]
      : (date as string);
    const normalizeTime = (t?: string) => (t ? t.slice(0, 5) : t);

    const shift = await DoctorSchedule.create({
      doctorId,
      date: normalizedDate,
      startTime: normalizeTime(startTime) as string,
      endTime: normalizeTime(endTime) as string,
    });

    res.status(201).json(shift);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tạo ca làm việc", error });
  }
};

// Admin: Tạo nhiều ca theo mảng
export const adminBulkCreateDoctorShifts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { doctorId, slots } = req.body as {
      doctorId?: string;
      slots?: Array<{ date: string; startTime: string; endTime: string }>;
    };

    if (!doctorId || !Array.isArray(slots) || slots.length === 0) {
      res.status(400).json({ message: "Thiếu dữ liệu đầu vào" });
      return;
    }

    const doctor = await Doctor.findById(doctorId).lean();
    if (!doctor) {
      res.status(404).json({ message: "Không tìm thấy bác sĩ" });
      return;
    }

    const docs = slots.map((s) => ({
      doctorId,
      date: (s.date || "").includes("T") ? s.date.split("T")[0] : s.date,
      startTime: (s.startTime || "").slice(0, 5),
      endTime: (s.endTime || "").slice(0, 5),
    }));
    const created = await DoctorSchedule.insertMany(docs);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tạo nhiều ca làm việc", error });
  }
};

// Admin: Lấy lịch theo bác sĩ + khoảng thời gian
export const adminGetDoctorShifts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { doctorId } = req.params as { doctorId: string };
    const { from, to } = req.query as { from?: string; to?: string };

    const q: any = { doctorId };
    if (from || to) {
      q.date = {} as any;
      if (from) (q.date as any).$gte = from;
      if (to) (q.date as any).$lte = to;
    }

    const items = await DoctorSchedule.find(q).sort({ date: 1, startTime: 1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy ca làm việc", error });
  }
};

// Admin: Lấy tất cả ca làm việc của mọi bác sĩ (tùy chọn theo khoảng thời gian)
export const adminGetAllShifts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { from, to } = req.query as { from?: string; to?: string };
    const q: any = {};
    if (from || to) {
      q.date = {} as any;
      if (from) (q.date as any).$gte = from;
      if (to) (q.date as any).$lte = to;
    }

    const items = await DoctorSchedule.find(q)
      .populate({ path: "doctorId", select: "name email specialty" })
      .sort({ date: 1, startTime: 1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy tất cả ca làm việc", error });
  }
};

// Admin: Lấy các ca cần xử lý (pending, rejected, busy)
export const adminGetPendingShifts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const items = await DoctorSchedule.find({
      status: { $in: ["pending", "rejected", "busy"] }
    })
      .populate({ path: "doctorId", select: "name email specialty" })
      .sort({ date: 1, startTime: 1 });
    
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy ca cần xử lý", error });
  }
};

// Admin: Thay thế bác sĩ cho ca làm việc
export const adminReplaceDoctor = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { newDoctorId, adminNote } = req.body as { 
      newDoctorId: string; 
      adminNote?: string;
    };

    if (!newDoctorId) {
      res.status(400).json({ message: "Thiếu ID bác sĩ mới" });
      return;
    }

    const existingShift = await DoctorSchedule.findById(id);
    if (!existingShift) {
      res.status(404).json({ message: "Không tìm thấy ca làm việc" });
      return;
    }

    // Kiểm tra bác sĩ mới có tồn tại không
    const newDoctor = await Doctor.findById(newDoctorId);
    if (!newDoctor) {
      res.status(404).json({ message: "Không tìm thấy bác sĩ mới" });
      return;
    }

    // Kiểm tra xem bác sĩ mới có bận vào thời gian này không
    const conflictingShift = await DoctorSchedule.findOne({
      doctorId: newDoctorId,
      date: existingShift.date,
      startTime: existingShift.startTime,
      endTime: existingShift.endTime,
      status: { $in: ["accepted", "pending"] }
    });

    if (conflictingShift) {
      res.status(400).json({ message: "Bác sĩ mới đã có lịch làm việc vào thời gian này" });
      return;
    }

    // Cập nhật ca làm việc
    existingShift.doctorId = new mongoose.Types.ObjectId(newDoctorId);
    existingShift.status = "pending";
    existingShift.rejectionReason = undefined;
    existingShift.busyReason = undefined;
    existingShift.adminNote = adminNote || `Đã thay thế từ bác sĩ ${existingShift.doctorId.toString()}`;
    
    await existingShift.save();

    res.json({ 
      message: "Đã thay thế bác sĩ thành công", 
      shift: existingShift 
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi thay thế bác sĩ", error });
  }
};

// Admin: Cập nhật ca (không cho sửa khi đã đặt)
export const adminUpdateDoctorShift = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const existing = await DoctorSchedule.findById(id);
    if (!existing) {
      res.status(404).json({ message: "Không tìm thấy ca làm việc" });
      return;
    }
    if (existing.isBooked) {
      res.status(400).json({ message: "Không thể sửa ca đã được đặt" });
      return;
    }
    const updated = await DoctorSchedule.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật ca làm việc", error });
  }
};

// Admin: Xóa ca (không cho xóa khi đã đặt)
export const adminDeleteDoctorShift = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const existing = await DoctorSchedule.findById(id);
    if (!existing) {
      res.status(404).json({ message: "Không tìm thấy ca làm việc" });
      return;
    }
    if (existing.isBooked) {
      res.status(400).json({ message: "Không thể xóa ca đã được đặt" });
      return;
    }
    await DoctorSchedule.findByIdAndDelete(id);
    res.json({ message: "Đã xóa ca làm việc" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa ca làm việc", error });
  }
};
