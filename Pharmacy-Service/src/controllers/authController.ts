import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import Staff from "../models/Staff";

const generateToken = (userId: string, role: string) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET as string, {
    expiresIn: "24h",
  });
};

// Register new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    // Check if staff already exists
    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) {
      res.status(400).json({ message: "Email đã được sử dụng" });
      return;
    }

    // Create new staff
    const user = await Staff.create({
      name,
      email,
      password,
      role: role || "staff",
    });

    // Generate token
    const token = generateToken(String(user._id), user.role);

    res.status(201).json({
      message: "Đăng ký thành công",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi đăng ký",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find staff and include password
    const user = await Staff.findOne({ email }).select("+password");
    if (!user) {
      res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
      return;
    }

    // Check if user is active and approved
    if (!user.active) {
      res.status(401).json({ message: "Tài khoản đã bị vô hiệu hóa" });
      return;
    }

    if (user.status !== "approved") {
      let message = "Tài khoản chưa được duyệt";
      if (user.status === "rejected") {
        message = user.rejectedReason || "Tài khoản đã bị từ chối";
      }
      res.status(401).json({ message });
      return;
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
      return;
    }

    // Generate token
    const token = generateToken(String(user._id), user.role);

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi đăng nhập",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get current staff profile
export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const user = await Staff.findById(userId);

    if (!user) {
      res.status(404).json({ message: "Không tìm thấy người dùng" });
      return;
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy thông tin người dùng",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Verify token
export const verifyToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const user = await Staff.findById(userId);

    if (!user || !user.active) {
      res
        .status(401)
        .json({ message: "Token không hợp lệ hoặc tài khoản bị vô hiệu hóa" });
      return;
    }

    res.json({
      valid: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(401).json({
      message: "Token không hợp lệ",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
