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
exports.getDoctorProfile = exports.doctorLogin = exports.doctorRegister = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Doctor_1 = __importDefault(require("../models/Doctor"));
const doctorRegister = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { name, email, password, phone, specialty, experience, workplace, description, education, certifications, languages, consultationFee, } = req.body;
        if (!name || !email || !password || !specialty) {
            res.status(400).json({
                success: false,
                message: "Vui lòng điền đầy đủ thông tin bắt buộc",
            });
            return;
        }
        const existingDoctor = yield Doctor_1.default.findOne({ email });
        if (existingDoctor) {
            res.status(400).json({
                success: false,
                message: "Email đã tồn tại",
            });
            return;
        }
        const doctor = new Doctor_1.default({
            name,
            email,
            password,
            phone,
            specialty,
            experience: experience ? parseInt(experience) : undefined,
            workplace,
            description,
            education: education ? education.split(",") : [],
            certifications: certifications ? certifications.split(",") : [],
            languages: languages ? languages.split(",") : [],
            consultationFee: consultationFee
                ? parseFloat(consultationFee)
                : undefined,
            license: (_a = req.file) === null || _a === void 0 ? void 0 : _a.path,
        });
        yield doctor.save();
        res.status(201).json({
            success: true,
            message: "Đăng ký thành công",
        });
    }
    catch (error) {
        console.error("Doctor registration error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server",
        });
    }
});
exports.doctorRegister = doctorRegister;
const doctorLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: "Email và password là bắt buộc",
            });
            return;
        }
        const doctor = yield Doctor_1.default.findOne({ email });
        if (!doctor) {
            res.status(401).json({
                success: false,
                message: "Email hoặc mật khẩu không đúng",
            });
            return;
        }
        const isPasswordValid = yield doctor.comparePassword(password);
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                message: "Email hoặc mật khẩu không đúng",
            });
            return;
        }
        const token = jsonwebtoken_1.default.sign({
            doctorId: doctor._id,
            email: doctor.email,
            role: "doctor",
        }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "24h" });
        const doctorData = {
            _id: doctor._id,
            name: doctor.name,
            email: doctor.email,
            phone: doctor.phone,
            specialty: doctor.specialty,
            experience: doctor.experience,
            workplace: doctor.workplace,
            description: doctor.description,
            education: doctor.education,
            certifications: doctor.certifications,
            languages: doctor.languages,
            consultationFee: doctor.consultationFee,
        };
        res.status(200).json({
            success: true,
            message: "Đăng nhập thành công",
            doctor: doctorData,
            token,
        });
    }
    catch (error) {
        console.error("Doctor login error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server",
        });
    }
});
exports.doctorLogin = doctorLogin;
const getDoctorProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const doctorId = req.doctorId;
        const doctor = yield Doctor_1.default.findById(doctorId).select("-password");
        if (!doctor) {
            res.status(404).json({
                success: false,
                message: "Không tìm thấy bác sĩ",
            });
            return;
        }
        res.status(200).json({
            success: true,
            doctor,
        });
    }
    catch (error) {
        console.error("Get doctor profile error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server",
        });
    }
});
exports.getDoctorProfile = getDoctorProfile;
