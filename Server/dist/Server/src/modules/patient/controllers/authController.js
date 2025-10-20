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
exports.getPatientProfile = exports.patientLogin = exports.patientRegister = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Patient_1 = __importDefault(require("../models/Patient"));
const patientRegister = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password, phone, dateOfBirth, gender, address } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({
                success: false,
                message: "Vui lòng điền đầy đủ thông tin bắt buộc",
            });
            return;
        }
        const existingPatient = yield Patient_1.default.findOne({ email });
        if (existingPatient) {
            res.status(400).json({
                success: false,
                message: "Email đã tồn tại",
            });
            return;
        }
        const patient = new Patient_1.default({
            name,
            email,
            password,
            phone,
            dateOfBirth,
            gender,
            address,
        });
        yield patient.save();
        // Return user data after successful registration
        const patientData = {
            _id: patient._id,
            name: patient.name,
            email: patient.email,
            phone: patient.phone,
            dateOfBirth: patient.dateOfBirth,
            gender: patient.gender,
            address: patient.address,
            role: "patient",
        };
        res.status(201).json({
            success: true,
            message: "Đăng ký thành công",
            user: patientData,
        });
    }
    catch (error) {
        console.error("Patient registration error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server",
        });
    }
});
exports.patientRegister = patientRegister;
const patientLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: "Email và password là bắt buộc",
            });
            return;
        }
        const patient = yield Patient_1.default.findOne({ email });
        if (!patient) {
            res.status(401).json({
                success: false,
                message: "Email hoặc mật khẩu không đúng",
            });
            return;
        }
        const isPasswordValid = yield patient.comparePassword(password);
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                message: "Email hoặc mật khẩu không đúng",
            });
            return;
        }
        const token = jsonwebtoken_1.default.sign({
            patientId: patient._id,
            email: patient.email,
            role: "patient",
        }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "24h" });
        const patientData = {
            _id: patient._id,
            name: patient.name,
            email: patient.email,
            phone: patient.phone,
            dateOfBirth: patient.dateOfBirth,
            gender: patient.gender,
            address: patient.address,
            role: "patient", // Thêm role vào response
        };
        res.status(200).json({
            success: true,
            message: "Đăng nhập thành công",
            user: patientData,
            token,
        });
    }
    catch (error) {
        console.error("Patient login error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server",
        });
    }
});
exports.patientLogin = patientLogin;
const getPatientProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const patientId = req.patientId;
        const patient = yield Patient_1.default.findById(patientId).select("-password");
        if (!patient) {
            res.status(404).json({
                success: false,
                message: "Không tìm thấy bệnh nhân",
            });
            return;
        }
        res.status(200).json({
            success: true,
            patient,
        });
    }
    catch (error) {
        console.error("Get patient profile error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server",
        });
    }
});
exports.getPatientProfile = getPatientProfile;
