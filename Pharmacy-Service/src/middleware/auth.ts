import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import Staff from "../models/Staff";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const internalToken = req.headers["x-internal-token"];

    if (!token && !internalToken) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // Check for internal service token (for admin access)
    if (internalToken === "admin-internal-token") {
      // Set admin user context for internal requests
      (req as any).user = { role: "admin", userId: "admin-internal" };
      next();
      return;
    }

    // Verify JWT token
    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as any;

      // Get full staff information
      const staff = await Staff.findById(decoded.userId);
      if (!staff || !staff.active) {
        res.status(401).json({ message: "Invalid or inactive user" });
        return;
      }

      (req as any).user = decoded;
      (req as any).staff = {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
      };
      next();
      return;
    }

    res.status(401).json({ message: "Invalid token" });
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};
