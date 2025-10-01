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
            res.status(401).json({
                success: false,
                message: "Token không hợp lệ",
            });
            return;
        }
        const token = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "your-secret-key");
        if (decoded.role !== "doctor") {
            res.status(403).json({
                success: false,
                message: "Không có quyền truy cập",
            });
            return;
        }
        // Gắn thông tin vào request để controller có thể dùng
        req.doctorId = decoded.doctorId;
        req.doctorEmail = decoded.email;
        req.doctorRole = decoded.role;
        next();
    }
    catch (error) {
        // Provide clearer response for expired tokens and avoid noisy stack logs
        if (error && error.name === "TokenExpiredError") {
            console.warn("Doctor token expired:", error.expiredAt);
            return res.status(401).json({
                success: false,
                message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
                expiredAt: error.expiredAt,
            });
        }
        console.warn("Doctor token verification error:", (error && error.message) || error);
        return res.status(401).json({
            success: false,
            message: "Token không hợp lệ",
        });
    }
};
exports.verifyDoctorToken = verifyDoctorToken;
