import { Router } from "express";
import { doctorRegister, doctorLogin, getDoctorProfile } from "../controllers";
import { verifyDoctorToken } from "../middlewares";
import multer from "multer";
import path from "path";

const router = Router();

// Cấu hình multer để lưu file license
const storage = multer.diskStorage({
  destination: (
    _req: Express.Request,
    _file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    cb(null, "uploads/");
  },
  filename: (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    cb(
      null,
      `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(
        file.originalname
      )}`
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    const allowedTypes = [".pdf", ".jpg", ".jpeg", ".png"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("File không hợp lệ"));
    }
  },
});

// Doctor auth routes
router.post("/register", upload.single("license"), doctorRegister);
router.post("/login", doctorLogin);
router.get("/profile", verifyDoctorToken, getDoctorProfile);

export default router;
