import { Router } from "express";
import {
  doctorRegister,
  doctorLogin,
  getDoctorProfile,
  updateDoctorProfile,
} from "../controllers";
import { verifyDoctorToken } from "../middlewares";
import multer from "multer";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

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

// Memory storage for avatar upload to Cloudinary
const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    const allowedTypes = [".jpg", ".jpeg", ".png", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Ảnh không hợp lệ"));
    }
  },
});

// Doctor auth routes
router.post("/register", uploadMemory.single("license"), doctorRegister);
router.post("/login", doctorLogin);
router.get("/profile", verifyDoctorToken, getDoctorProfile);
router.put("/profile", verifyDoctorToken, updateDoctorProfile);

// Upload ảnh avatar lên Cloudinary và trả về URL
router.post(
  "/profile/avatar",
  verifyDoctorToken,
  uploadMemory.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: "Thiếu file ảnh" });
        return;
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "doctors/avatars", resource_type: "image" },
        (error, result) => {
          if (error || !result) {
            res
              .status(500)
              .json({ success: false, message: "Upload thất bại", error });
            return;
          }
          res.json({ success: true, url: result.secure_url });
        }
      );

      // Pipe buffer to cloudinary
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    } catch (e) {
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  }
);

export default router;
