"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const patientAuth_1 = require("../middlewares/patientAuth");
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const cloudinary_1 = require("../../../shared/utils/cloudinary");
const router = (0, express_1.Router)();
// Configure Multer for storing insurance card and ID images
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, "uploads/");
    },
    filename: (_req, file, cb) => {
        // Generate unique filename with original extension
        const uniqueId = (0, uuid_1.v4)();
        const extension = path_1.default.extname(file.originalname);
        cb(null, Date.now() + "-" + uniqueId + extension);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (_req, file, cb) => {
        // Allow only images and PDFs
        if (file.mimetype.startsWith("image/") ||
            file.mimetype === "application/pdf") {
            cb(null, true);
        }
        else {
            cb(null, false);
        }
    },
});
// Upload BHYT card image
router.post("/insurance-card", patientAuth_1.verifyPatientToken, upload.single("insuranceCard"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Không có file được tải lên",
            });
        }
        // Upload to cloudinary
        const { url } = yield (0, cloudinary_1.uploadToCloudinary)(req.file.path, "insurance-cards");
        res.status(200).json({
            success: true,
            message: "Tải lên thành công",
            filePath: url,
        });
    }
    catch (error) {
        console.error("Insurance card upload error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tải lên ảnh BHYT",
        });
    }
}));
// Upload ID (CCCD/CMND) image
router.post("/id-document", patientAuth_1.verifyPatientToken, upload.single("idDocument"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Không có file được tải lên",
            });
        }
        // Upload to cloudinary
        const { url } = yield (0, cloudinary_1.uploadToCloudinary)(req.file.path, "id-documents");
        res.status(200).json({
            success: true,
            message: "Tải lên thành công",
            filePath: url,
        });
    }
    catch (error) {
        console.error("ID document upload error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tải lên ảnh CCCD/CMND",
        });
    }
}));
exports.default = router;
