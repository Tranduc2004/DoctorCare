import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";

interface AdminJwtPayload {
  adminId: string;
  username: string;
  role: string;
}

export const verifyAdminToken: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Token không hợp lệ",
      });
      return;
    }

    const token = authHeader.substring(7); // Bỏ "Bearer "

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    ) as AdminJwtPayload;

    // Check role
    if (decoded.role !== "admin") {
      res.status(401).json({
        success: false,
        message: "Không có quyền truy cập",
      });
      return;
    }

    // Gắn thông tin vào request
    (req as any).adminId = decoded.adminId;
    (req as any).adminUsername = decoded.username;
    (req as any).adminRole = decoded.role;

    next();
  } catch (error) {
    console.error("Admin token verification error:", error);
    res.status(401).json({
      success: false,
      message: "Token không hợp lệ hoặc đã hết hạn",
    });
  }
};

// Export alias để tương thích với code hiện tại
export const adminAuth = verifyAdminToken;
