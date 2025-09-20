import { Request, Response } from "express";
import DoctorSchedule from "../../doctor/models/DoctorSchedule";
import Doctor from "../../doctor/models/Doctor";
import mongoose from "mongoose";

function toMinutes(t?: string): number {
  if (!t) return 0;
  const [h, m] = t
    .slice(0, 5)
    .split(":")
    .map((x) => parseInt(x, 10));
  return h * 60 + m;
}
function toTime(mins: number): string {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

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

    const normStart = normalizeTime(startTime) as string;
    const normEnd = normalizeTime(endTime) as string;

    // Specialty guard: specialties must differ within identical window
    const existingSameWindow = await DoctorSchedule.find({
      date: normalizedDate,
      startTime: normStart,
      endTime: normEnd,
    })
      .populate({ path: "doctorId", select: "specialty" })
      .lean();

    const newDoctor = await Doctor.findById(doctorId)
      .select("specialty")
      .lean();
    const newSpec =
      (newDoctor as any)?.specialty?.toString?.() ??
      (newDoctor as any)?.specialty;
    const hasDuplicateSpecialty = existingSameWindow.some((s: any) => {
      const spec = (s.doctorId as any)?.specialty;
      const specId = spec?.toString?.() ?? spec;
      return specId && newSpec && specId === newSpec;
    });
    if (hasDuplicateSpecialty) {
      res
        .status(400)
        .json({ message: "Đã có bác sĩ cùng chuyên khoa trong khung giờ này" });
      return;
    }

    // Split long shift into 60-minute slots
    const startM = toMinutes(normStart);
    const endM = toMinutes(normEnd);
    const SLOTP = 60;
    const created: any[] = [];
    for (let s = startM; s < endM; s += SLOTP) {
      const e = Math.min(s + SLOTP, endM);
      if (e - s <= 0) continue;
      const st = toTime(s);
      const et = toTime(e);
      const exists = await DoctorSchedule.findOne({
        doctorId,
        date: normalizedDate,
        startTime: st,
        endTime: et,
      }).lean();
      if (exists) continue;
      const item = await DoctorSchedule.create({
        doctorId,
        date: normalizedDate,
        startTime: st,
        endTime: et,
      });
      created.push(item);
    }

    res
      .status(201)
      .json(created.length ? created : { message: "No new slots" });
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

    const newDoctor = await Doctor.findById(doctorId)
      .select("specialty")
      .lean();
    if (!newDoctor) {
      res.status(404).json({ message: "Không tìm thấy bác sĩ" });
      return;
    }
    const newSpec =
      (newDoctor as any)?.specialty?.toString?.() ??
      (newDoctor as any)?.specialty;

    const prepared: Array<{
      doctorId: string;
      date: string;
      startTime: string;
      endTime: string;
    }> = [];
    for (const s of slots) {
      const date = (s.date || "").includes("T")
        ? s.date.split("T")[0]
        : s.date || "";
      const startTime = (s.startTime || "").slice(0, 5);
      const endTime = (s.endTime || "").slice(0, 5);

      const existingSameWindow = await DoctorSchedule.find({
        date,
        startTime,
        endTime,
      })
        .populate({ path: "doctorId", select: "specialty" })
        .lean();

      const hasDuplicateSpecialty = existingSameWindow.some((it: any) => {
        const spec = (it.doctorId as any)?.specialty;
        const specId = spec?.toString?.() ?? spec;
        return specId && newSpec && specId === newSpec;
      });
      if (hasDuplicateSpecialty) {
        res.status(400).json({
          message: `Khung giờ ${date} ${startTime}-${endTime} đã có bác sĩ cùng chuyên khoa`,
        });
        return;
      }

      prepared.push({ doctorId, date, startTime, endTime });
    }

    const created = await DoctorSchedule.insertMany(prepared);
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
      status: { $in: ["pending", "rejected", "busy"] },
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
  console.log("🚀 adminReplaceDoctor function called!");
  try {
    console.log("=== adminReplaceDoctor Debug ===");
    console.log("Request params:", req.params);
    console.log("Request body:", req.body);
    console.log("Request method:", req.method);
    console.log("Request URL:", req.url);

    const { id } = req.params as { id: string };
    const { newDoctorId, adminNote, forceReplace } = req.body as {
      newDoctorId: string;
      adminNote?: string;
      forceReplace?: boolean;
    };

    console.log("Extracted id:", id);
    console.log("Extracted newDoctorId:", newDoctorId);
    console.log("Extracted adminNote:", adminNote);
    console.log("Extracted forceReplace:", forceReplace);

    // Kiểm tra format ObjectId cho schedule ID
    console.log(
      "Validating schedule ID:",
      id,
      "Valid:",
      mongoose.Types.ObjectId.isValid(id)
    );
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("❌ Invalid schedule ID:", id);
      res.status(400).json({ message: "ID lịch làm việc không hợp lệ" });
      return;
    }

    if (!newDoctorId) {
      console.log("❌ Missing newDoctorId");
      res.status(400).json({ message: "Thiếu ID bác sĩ mới" });
      return;
    }

    // Kiểm tra format ObjectId
    console.log(
      "Validating newDoctorId:",
      newDoctorId,
      "Valid:",
      mongoose.Types.ObjectId.isValid(newDoctorId)
    );
    if (!mongoose.Types.ObjectId.isValid(newDoctorId)) {
      console.log("❌ Invalid newDoctorId:", newDoctorId);
      res.status(400).json({ message: "ID bác sĩ mới không hợp lệ" });
      return;
    }

    const existingShift = await DoctorSchedule.findById(id);
    console.log("Found existing shift:", existingShift ? "✅ Yes" : "❌ No");
    if (!existingShift) {
      console.log("❌ Schedule not found with ID:", id);
      res.status(404).json({ message: "Không tìm thấy ca làm việc" });
      return;
    }

    // Kiểm tra xem có phải thay thế bằng chính bác sĩ hiện tại không
    console.log("Current doctorId:", existingShift.doctorId.toString());
    console.log("New doctorId:", newDoctorId);
    console.log(
      "Same doctor check:",
      existingShift.doctorId.toString() === newDoctorId
    );
    if (existingShift.doctorId.toString() === newDoctorId) {
      console.log("❌ Cannot replace with same doctor");
      res
        .status(400)
        .json({ message: "Không thể thay thế bằng chính bác sĩ hiện tại" });
      return;
    }

    // Kiểm tra xem lịch đã được đặt chưa
    console.log("Schedule isBooked:", existingShift.isBooked);
    if (existingShift.isBooked) {
      console.log("❌ Cannot replace doctor for booked schedule");
      res
        .status(400)
        .json({ message: "Không thể thay thế bác sĩ cho lịch đã được đặt" });
      return;
    }

    // Kiểm tra bác sĩ mới có tồn tại không
    const newDoctor = await Doctor.findById(newDoctorId);
    console.log("Found new doctor:", newDoctor ? "✅ Yes" : "❌ No");
    if (!newDoctor) {
      console.log("❌ New doctor not found with ID:", newDoctorId);
      res.status(404).json({ message: "Không tìm thấy bác sĩ mới" });
      return;
    }

    // Kiểm tra xem bác sĩ mới có bận vào thời gian này không
    // Chỉ kiểm tra xung đột với các ca đã được chấp nhận (accepted)
    console.log("Checking for conflicting shifts...");
    const conflictingShift = await DoctorSchedule.findOne({
      doctorId: newDoctorId,
      date: existingShift.date,
      startTime: existingShift.startTime,
      endTime: existingShift.endTime,
      status: "accepted", // Chỉ kiểm tra với ca đã được chấp nhận
    });

    console.log(
      "Found conflicting shift:",
      conflictingShift ? "✅ Yes" : "❌ No"
    );

    // Nếu có xung đột và không force replace, thì báo lỗi
    if (conflictingShift && !forceReplace) {
      console.log("❌ New doctor has conflicting schedule");
      res.status(400).json({
        message:
          "Bác sĩ mới đã có lịch làm việc được chấp nhận vào thời gian này. Bạn có thể sử dụng forceReplace=true để bỏ qua kiểm tra này.",
        hasConflict: true,
        conflictingShift: {
          id: conflictingShift._id,
          date: conflictingShift.date,
          startTime: conflictingShift.startTime,
          endTime: conflictingShift.endTime,
        },
      });
      return;
    }

    // Nếu có xung đột và force replace, thì ghi log cảnh báo
    if (conflictingShift && forceReplace) {
      console.log("⚠️ Force replacing despite conflict - admin override");
    }

    // Lưu doctorId cũ trước khi thay đổi
    const oldDoctorId = existingShift.doctorId;

    // Kiểm tra quy tắc nhiều bác sĩ/không trùng chuyên khoa cho cùng khung giờ
    const sameWindow = await DoctorSchedule.find({
      date: existingShift.date,
      startTime: existingShift.startTime,
      endTime: existingShift.endTime,
      _id: { $ne: existingShift._id },
    })
      .populate({ path: "doctorId", select: "specialty" })
      .lean();

    const newDoctorSpec =
      (newDoctor as any)?.specialty?.toString?.() ??
      (newDoctor as any)?.specialty;
    const duplicateSpec = sameWindow.some((it: any) => {
      const spec = (it.doctorId as any)?.specialty;
      const specId = spec?.toString?.() ?? spec;
      return specId && newDoctorSpec && specId === newDoctorSpec;
    });
    if (duplicateSpec) {
      res
        .status(400)
        .json({ message: "Đã có bác sĩ cùng chuyên khoa trong khung giờ này" });
      return;
    }

    // Cập nhật ca làm việc
    existingShift.doctorId = new mongoose.Types.ObjectId(newDoctorId);
    existingShift.status = "pending";
    existingShift.rejectionReason = undefined;
    existingShift.busyReason = undefined;
    existingShift.adminNote =
      adminNote || `Đã thay thế từ bác sĩ ${oldDoctorId.toString()}`;

    await existingShift.save();
    console.log("✅ Doctor replacement successful!");

    res.json({
      message: "Đã thay thế bác sĩ thành công",
      shift: existingShift,
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
