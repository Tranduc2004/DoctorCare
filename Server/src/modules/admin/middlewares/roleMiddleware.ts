import { Request, Response, NextFunction } from "express";

export const requireAdminRole = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminRole = (req as any).adminRole;

    if (!adminRole || adminRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Yêu cầu quyền admin",
      });
    }

    next();
  } catch (error) {
    console.error("Admin role verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi xác thực quyền",
    });
  }
};

export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminRole = (req as any).adminRole;
    const adminUsername = (req as any).adminUsername;

    // Chỉ admin chính mới có quyền super admin
    if (!adminRole || adminRole !== "admin" || adminUsername !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Yêu cầu quyền super admin",
      });
    }

    next();
  } catch (error) {
    console.error("Super admin verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi xác thực quyền",
    });
  }
};
