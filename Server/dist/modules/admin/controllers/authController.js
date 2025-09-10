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
exports.getAdminProfile = exports.adminLogin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Admin_1 = __importDefault(require("../models/Admin"));
const adminLogin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        // Validate input
        if (!username || !password) {
            res.status(400).json({
                success: false,
                message: "Username và password là bắt buộc",
            });
            return;
        }
        // Find admin by username
        const admin = yield Admin_1.default.findOne({ username });
        if (!admin) {
            res.status(401).json({
                success: false,
                message: "Tên đăng nhập hoặc mật khẩu không đúng",
            });
            return;
        }
        // Check password
        const isPasswordValid = yield admin.comparePassword(password);
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                message: "Tên đăng nhập hoặc mật khẩu không đúng",
            });
            return;
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({
            adminId: admin._id,
            username: admin.username,
            role: admin.role,
        }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "24h" });
        // Return admin data (without password) and token
        const adminData = {
            _id: admin._id,
            username: admin.username,
            email: admin.email,
            role: admin.role,
            createdAt: admin.createdAt,
            updatedAt: admin.updatedAt,
        };
        res.status(200).json({
            success: true,
            message: "Đăng nhập thành công",
            admin: adminData,
            token,
        });
    }
    catch (error) {
        console.error("Admin login error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server",
        });
    }
});
exports.adminLogin = adminLogin;
const getAdminProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get admin ID from JWT token (set by auth middleware)
        const adminId = req.adminId;
        const admin = yield Admin_1.default.findById(adminId).select("-password");
        if (!admin) {
            res.status(404).json({
                success: false,
                message: "Không tìm thấy admin",
            });
            return;
        }
        res.status(200).json({
            success: true,
            admin,
        });
    }
    catch (error) {
        console.error("Get admin profile error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server",
        });
    }
});
exports.getAdminProfile = getAdminProfile;
