import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";

interface PatientJwtPayload {
  patientId: string;
  email: string;
  name: string;
  role: string;
}

export const verifyPatientToken: RequestHandler = (
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
    ) as PatientJwtPayload;

    if (decoded.role !== "patient") {
      res.status(403).json({
        success: false,
        message: "Không có quyền truy cập",
      });
      return;
    }

    // Gắn thông tin vào request để controller dùng
    (req as any).patientId = decoded.patientId;
    (req as any).patientEmail = decoded.email;
    (req as any).patientName = decoded.name;
    (req as any).patientRole = decoded.role;

    next();
  } catch (error) {
    console.error("Patient token verification error:", error);
    res.status(401).json({
      success: false,
      message: "Token không hợp lệ hoặc đã hết hạn",
    });
  }
};
