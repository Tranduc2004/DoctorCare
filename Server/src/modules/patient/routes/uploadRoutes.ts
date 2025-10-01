import { Router } from "express";
import multer from "multer";
import { verifyPatientToken } from "../middlewares/patientAuth";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { Request, Response } from "express";
import { uploadToCloudinary } from "../../../shared/utils/cloudinary";

const router = Router();

// Configure Multer for storing insurance card and ID images
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, "uploads/");
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    // Generate unique filename with original extension
    const uniqueId = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, Date.now() + "-" + uniqueId + extension);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    // Allow only images and PDFs
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

// Upload BHYT card image
router.post(
  "/insurance-card",
  verifyPatientToken,
  upload.single("insuranceCard"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Không có file được tải lên",
        });
      }

      // Upload to cloudinary
      const { url } = await uploadToCloudinary(
        req.file.path,
        "insurance-cards"
      );

      res.status(200).json({
        success: true,
        message: "Tải lên thành công",
        filePath: url,
      });
    } catch (error) {
      console.error("Insurance card upload error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tải lên ảnh BHYT",
      });
    }
  }
);

// Upload ID (CCCD/CMND) image
router.post(
  "/id-document",
  verifyPatientToken,
  upload.single("idDocument"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Không có file được tải lên",
        });
      }

      // Upload to cloudinary
      const { url } = await uploadToCloudinary(req.file.path, "id-documents");

      res.status(200).json({
        success: true,
        message: "Tải lên thành công",
        filePath: url,
      });
    } catch (error) {
      console.error("ID document upload error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tải lên ảnh CCCD/CMND",
      });
    }
  }
);

export default router;
