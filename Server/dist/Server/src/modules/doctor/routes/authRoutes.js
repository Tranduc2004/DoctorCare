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
const controllers_1 = require("../controllers");
const middlewares_1 = require("../middlewares");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const cloudinary_1 = require("cloudinary");
const streamifier_1 = __importDefault(require("streamifier"));
const router = (0, express_1.Router)();
// Cấu hình multer để lưu file license
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, "uploads/");
    },
    filename: (_req, file, cb) => {
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path_1.default.extname(file.originalname)}`);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
        const allowedTypes = [".pdf", ".jpg", ".jpeg", ".png"];
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        }
        else {
            cb(new Error("File không hợp lệ"));
        }
    },
});
// Memory storage for avatar upload to Cloudinary
const uploadMemory = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = [".jpg", ".jpeg", ".png", ".webp"];
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        }
        else {
            cb(new Error("Ảnh không hợp lệ"));
        }
    },
});
// Doctor auth routes
router.post("/register", uploadMemory.single("license"), controllers_1.doctorRegister);
router.post("/login", controllers_1.doctorLogin);
router.get("/profile", middlewares_1.verifyDoctorToken, controllers_1.getDoctorProfile);
router.put("/profile", middlewares_1.verifyDoctorToken, controllers_1.updateDoctorProfile);
// Upload ảnh avatar lên Cloudinary và trả về URL
router.post("/profile/avatar", middlewares_1.verifyDoctorToken, uploadMemory.single("avatar"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, message: "Thiếu file ảnh" });
            return;
        }
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({ folder: "doctors/avatars", resource_type: "image" }, (error, result) => {
            if (error || !result) {
                res
                    .status(500)
                    .json({ success: false, message: "Upload thất bại", error });
                return;
            }
            res.json({ success: true, url: result.secure_url });
        });
        // Pipe buffer to cloudinary
        streamifier_1.default.createReadStream(req.file.buffer).pipe(uploadStream);
    }
    catch (e) {
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
}));
exports.default = router;
