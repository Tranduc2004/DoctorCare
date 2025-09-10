"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuth = exports.verifyAdminToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verifyAdminToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                success: false,
                message: "Token không hợp lệ",
            });
            return;
        }
        const token = authHeader.substring(7); // Bỏ "Bearer "
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "your-secret-key");
        // Check role
        if (decoded.role !== "admin") {
            res.status(401).json({
                success: false,
                message: "Không có quyền truy cập",
            });
            return;
        }
        // Gắn thông tin vào request
        req.adminId = decoded.adminId;
        req.adminUsername = decoded.username;
        req.adminRole = decoded.role;
        next();
    }
    catch (error) {
        console.error("Admin token verification error:", error);
        res.status(401).json({
            success: false,
            message: "Token không hợp lệ hoặc đã hết hạn",
        });
    }
};
exports.verifyAdminToken = verifyAdminToken;
// Export alias để tương thích với code hiện tại
exports.adminAuth = exports.verifyAdminToken;
