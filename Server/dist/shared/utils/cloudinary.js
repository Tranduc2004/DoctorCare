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
exports.deleteFromCloudinary = exports.uploadToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const fs_1 = __importDefault(require("fs"));
// Cấu hình cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const uploadToCloudinary = (filePath_1, ...args_1) => __awaiter(void 0, [filePath_1, ...args_1], void 0, function* (filePath, folder = "general") {
    try {
        // Upload file lên cloudinary
        const result = yield cloudinary_1.v2.uploader.upload(filePath, {
            folder: `medicare/${folder}`, // Tên thư mục trên cloudinary
            resource_type: "auto", // Tự động phát hiện loại file
        });
        // Xóa file tạm sau khi upload
        fs_1.default.unlinkSync(filePath);
        return {
            url: result.secure_url,
            public_id: result.public_id,
        };
    }
    catch (error) {
        // Xóa file tạm nếu upload thất bại
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        console.error("Cloudinary upload error:", error);
        throw error;
    }
});
exports.uploadToCloudinary = uploadToCloudinary;
const deleteFromCloudinary = (public_id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield cloudinary_1.v2.uploader.destroy(public_id);
    }
    catch (error) {
        console.error("Cloudinary delete error:", error);
        throw error;
    }
});
exports.deleteFromCloudinary = deleteFromCloudinary;
exports.default = cloudinary_1.v2;
