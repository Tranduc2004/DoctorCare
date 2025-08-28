"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyDoctorToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verifyDoctorToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Token không hợp lệ",
            });
        }
        const token = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "your-secret-key");
        if (decoded.role !== "doctor") {
            return res.status(403).json({
                success: false,
                message: "Không có quyền truy cập",
            });
        }
        req.doctorId = decoded.doctorId;
        req.doctorUsername = decoded.username;
        req.doctorRole = decoded.role;
        next();
    }
    catch (error) {
        console.error("Doctor token verification error:", error);
        return res.status(401).json({
            success: false,
            message: "Token không hợp lệ hoặc đã hết hạn",
        });
    }
};
exports.verifyDoctorToken = verifyDoctorToken;
