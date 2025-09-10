import { Request, Response, NextFunction, RequestHandler } from "express";
import Patient from "../../patient/models/Patient";
import Doctor from "../../doctor/models/Doctor";

// Admin: Lấy tất cả người dùng
export const getAllUsers: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const [patients, doctors] = await Promise.all([
      Patient.find().select("-password").sort({ createdAt: -1 }).lean(),
      Doctor.find().select("-password").sort({ createdAt: -1 }).lean(),
    ]);

    const users = [
      ...patients.map((p: any) => ({ ...p, role: "patient" })),
      ...doctors.map((d: any) => ({ ...d, role: "doctor" })),
    ];

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách người dùng", error });
  }
};

// Admin: Lấy người dùng theo role
export const getUsersByRole: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { role } = req.params as { role: string };
    if (role === "patient") {
      const patients = await Patient.find()
        .select("-password")
        .sort({ createdAt: -1 })
        .lean();
      res.json(patients.map((p: any) => ({ ...p, role: "patient" })));
      return;
    }

    if (role === "doctor") {
      const { status } = req.query as { status?: string };
      const filter: any = {};
      if (status) filter.status = status;
      const doctors = await Doctor.find(filter)
        .select("-password")
        .populate("specialty", "name")
        .sort({ createdAt: -1 })
        .lean();
      res.json(doctors.map((d: any) => ({ ...d, role: "doctor" })));
      return;
    }

    if (role === "admin") {
      // Hệ thống không trộn admin vào Patient/Doctor ở controllers hiện tại
      res.json([]);
      return;
    }

    res.json([]);
    return;
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách người dùng", error });
  }
};

// Admin: Cập nhật thông tin người dùng
export const updateUser: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params as { id: string };
    const { role, ...updateData } = req.body as Record<string, unknown> & {
      role?: string;
    };

    // Không cho phép cập nhật password qua API này
    delete updateData.password;

    // Xác định collection dựa trên role được gửi lên hoặc thử cả hai
    let user = null as any;
    if (role === "patient") {
      user = await Patient.findByIdAndUpdate(id, updateData, { new: true })
        .select("-password")
        .lean();
      if (user) user.role = "patient";
    } else if (role === "doctor") {
      user = await Doctor.findByIdAndUpdate(id, updateData, { new: true })
        .select("-password")
        .lean();
      if (user) user.role = "doctor";
    } else {
      // Thử tìm ở cả hai khi không truyền role
      user = await Patient.findByIdAndUpdate(id, updateData, { new: true })
        .select("-password")
        .lean();
      if (user) user.role = "patient";
      if (!user) {
        user = await Doctor.findByIdAndUpdate(id, updateData, { new: true })
          .select("-password")
          .lean();
        if (user) user.role = "doctor";
      }
    }

    if (!user) {
      res.status(404).json({ message: "Không tìm thấy người dùng" });
      return;
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật người dùng", error });
  }
};

// Admin: Xóa người dùng
export const deleteUser: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params as { id: string };
    // Thử xóa ở cả hai collection
    let deleted = await Patient.findByIdAndDelete(id);
    if (!deleted) {
      deleted = await Doctor.findByIdAndDelete(id);
    }
    if (!deleted) {
      res.status(404).json({ message: "Không tìm thấy người dùng" });
      return;
    }

    res.json({ message: "Xóa người dùng thành công" });
    return;
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa người dùng", error });
    return;
  }
};

// Admin: Thống kê người dùng
export const getUserStats: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const [patients, doctors] = await Promise.all([
      Patient.countDocuments(),
      Doctor.countDocuments(),
    ]);

    const total = patients + doctors; // Admin tách riêng
    const admins = 0;

    res.json({ total, patients, doctors, admins });
    return;
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy thống kê", error });
    return;
  }
};

// Admin: Chi tiết người dùng theo id
export const getUserById: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params as { id: string };
    // Thử tìm ở bệnh nhân trước
    let user = await Patient.findById(id).select("-password").lean();
    if (user) {
      res.json({ ...user, role: "patient" });
      return;
    }
    // Nếu không có, thử ở bác sĩ
    user = await Doctor.findById(id).select("-password").lean();
    if (user) {
      res.json({ ...user, role: "doctor" });
      return;
    }
    res.status(404).json({ message: "Không tìm thấy người dùng" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy chi tiết người dùng", error });
  }
};
