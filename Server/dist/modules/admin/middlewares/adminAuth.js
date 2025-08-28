"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAdminToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verifyAdminToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Token không hợp lệ",
            });
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "your-secret-key");
        // Check if user is admin
        if (decoded.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Không có quyền truy cập",
            });
        }
        // Add admin info to request
        req.adminId = decoded.adminId;
        req.adminUsername = decoded.username;
        req.adminRole = decoded.role;
        next();
    }
    catch (error) {
        console.error("Admin token verification error:", error);
        return res.status(401).json({
            success: false,
            message: "Token không hợp lệ hoặc đã hết hạn",
        });
    }
};
exports.verifyAdminToken = verifyAdminToken;
