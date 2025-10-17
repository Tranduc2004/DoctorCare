import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const internalToken = req.headers["x-internal-token"];

    if (!token && !internalToken) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // Check for internal service token
    if (internalToken === process.env.INTERNAL_SERVICE_TOKEN) {
      next();
      return;
    }

    // Verify JWT token
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
      (req as any).user = decoded;
      next();
      return;
    }

    res.status(401).json({ message: "Invalid token" });
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};
