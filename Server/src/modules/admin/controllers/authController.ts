import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin";

export const adminLogin: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: "Username và password là bắt buộc",
      });
      return;
    }

    // Find admin by username
    const admin = await Admin.findOne({ username });
    if (!admin) {
      res.status(401).json({
        success: false,
        message: "Tên đăng nhập hoặc mật khẩu không đúng",
      });
      return;
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Tên đăng nhập hoặc mật khẩu không đúng",
      });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        adminId: admin._id,
        username: admin.username,
        role: admin.role,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    // Return admin data (without password) and token
    const adminData = {
      _id: admin._id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      admin: adminData,
      token,
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

export const getAdminProfile: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get admin ID from JWT token (set by auth middleware)
    const adminId = (req as any).adminId;

    const admin = await Admin.findById(adminId).select("-password");
    if (!admin) {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy admin",
      });
      return;
    }

    res.status(200).json({
      success: true,
      admin,
    });
  } catch (error) {
    console.error("Get admin profile error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};
