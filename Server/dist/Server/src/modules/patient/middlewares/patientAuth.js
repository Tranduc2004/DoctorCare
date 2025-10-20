"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPatientToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verifyPatientToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                success: false,
                message: "Token không hợp lệ",
            });
            return;
        }
        const token = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "your-secret-key");
        if (decoded.role !== "patient") {
            res.status(403).json({
                success: false,
                message: "Không có quyền truy cập",
            });
            return;
        }
        // Gắn thông tin vào request để controller dùng
        req.patientId = decoded.patientId;
        req.patientEmail = decoded.email;
        req.patientName = decoded.name;
        req.patientRole = decoded.role;
        next();
    }
    catch (error) {
        console.error("Patient token verification error:", error);
        res.status(401).json({
            success: false,
            message: "Token không hợp lệ hoặc đã hết hạn",
        });
    }
};
exports.verifyPatientToken = verifyPatientToken;
