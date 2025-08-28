import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";

interface DoctorJwtPayload {
  doctorId: string;
  email: string;
  name: string;
  role: string;
}

export const verifyDoctorToken: RequestHandler = (
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

    const token = authHeader.substring(7);

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    ) as DoctorJwtPayload;

    if (decoded.role !== "doctor") {
      res.status(403).json({
        success: false,
        message: "Không có quyền truy cập",
      });
      return;
    }

    // Gắn thông tin vào request để controller có thể dùng
    (req as any).doctorId = decoded.doctorId;
    (req as any).doctorEmail = decoded.email;
    (req as any).doctorRole = decoded.role;

    next();
  } catch (error) {
    console.error("Doctor token verification error:", error);
    res.status(401).json({
      success: false,
      message: "Token không hợp lệ hoặc đã hết hạn",
    });
  }
};
