"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.getCurrentUser = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Staff_1 = __importDefault(require("../models/Staff"));
const generateToken = (userId, role) => {
    return jsonwebtoken_1.default.sign({ userId, role }, process.env.JWT_SECRET, {
        expiresIn: "24h",
    });
};
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const existingStaff = await Staff_1.default.findOne({ email });
        if (existingStaff) {
            res.status(400).json({ message: "Email đã được sử dụng" });
            return;
        }
        const user = await Staff_1.default.create({
            name,
            email,
            password,
            role: role || "staff",
        });
        const token = generateToken(String(user._id), user.role);
        res.status(201).json({
            message: "Đăng ký thành công",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Lỗi khi đăng ký",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await Staff_1.default.findOne({ email }).select("+password");
        if (!user) {
            res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
            return;
        }
        if (!user.active) {
            res.status(401).json({ message: "Tài khoản đã bị vô hiệu hóa" });
            return;
        }
        if (user.status !== "approved") {
            let message = "Tài khoản chưa được duyệt";
            if (user.status === "rejected") {
                message = user.rejectedReason || "Tài khoản đã bị từ chối";
            }
            res.status(401).json({ message });
            return;
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
            return;
        }
        const token = generateToken(String(user._id), user.role);
        res.json({
            message: "Đăng nhập thành công",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Lỗi khi đăng nhập",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.login = login;
const getCurrentUser = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await Staff_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ message: "Không tìm thấy người dùng" });
            return;
        }
        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Lỗi khi lấy thông tin người dùng",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.getCurrentUser = getCurrentUser;
const verifyToken = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await Staff_1.default.findById(userId);
        if (!user || !user.active) {
            res
                .status(401)
                .json({ message: "Token không hợp lệ hoặc tài khoản bị vô hiệu hóa" });
            return;
        }
        res.json({
            valid: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        res.status(401).json({
            message: "Token không hợp lệ",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.verifyToken = verifyToken;
//# sourceMappingURL=authController.js.map