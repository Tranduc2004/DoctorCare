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
exports.resetPassword = exports.forgotPassword = void 0;
const crypto_1 = __importDefault(require("crypto"));
const Patient_1 = __importDefault(require("../../modules/patient/models/Patient"));
const utils_1 = require("../utils");
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ success: false, message: "Email là bắt buộc" });
            return;
        }
        const patient = yield Patient_1.default.findOne({ email });
        if (!patient) {
            // Trả về thành công để tránh lộ thông tin tài khoản tồn tại hay không
            res.status(200).json({
                success: true,
                message: "Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi",
            });
            return;
        }
        const token = crypto_1.default.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 giờ
        patient.resetPasswordToken = token;
        patient.resetPasswordExpires = expires;
        yield patient.save();
        const resetLink = `${CLIENT_URL}/reset-password?token=${token}`;
        const subject = "Đặt lại mật khẩu - MediCare";
        const html = `
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f1f5f9, #e2e8f0); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px rgba(59, 130, 246, 0.15);">
        
        <!-- Header với gradient blue-teal -->
        <div style="background: linear-gradient(135deg, #3b82f6, #14b8a6); padding: 50px 30px; text-align: center; position: relative;">
            <!-- Decorative elements -->
            <div style="position: absolute; top: 20px; left: 20px; width: 40px; height: 40px; border: 2px solid rgba(255,255,255,0.2); border-radius: 50%; opacity: 0.6;"></div>
            <div style="position: absolute; bottom: 20px; right: 20px; width: 60px; height: 60px; border: 2px solid rgba(255,255,255,0.1); border-radius: 50%; opacity: 0.4;"></div>
            
            <!-- Logo MediCare -->
            <div style="margin-bottom: 20px;">
                <div style="display: inline-flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); border-radius: 16px; padding: 15px 25px; border: 2px solid rgba(255,255,255,0.2);">
                    <div style="margin-right: 12px;">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z" fill="white"/>
                        </svg>
                    </div>
                    <div style="text-align: left;">
                        <div style="color: white; font-size: 24px; font-weight: 800; line-height: 1; margin-bottom: 2px;">
                            Medi<span style="color: #14b8a6;">Care</span>
                        </div>
                        <div style="color: rgba(255,255,255,0.9); font-size: 11px; font-weight: 400; letter-spacing: 0.5px;">
                            HEALTHCARE SYSTEM
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Content -->
        <div style="padding: 50px 35px;">
            <div style="text-align: center; margin-bottom: 35px;">
                <div style="width: 80px; height: 4px; background: linear-gradient(135deg, #3b82f6, #14b8a6); margin: 0 auto 25px; border-radius: 2px;"></div>
                <h2 style="color: #1e293b; margin: 0; font-size: 30px; font-weight: 700; letter-spacing: -0.5px;">Đặt Lại Mật Khẩu</h2>
                <p style="color: #64748b; margin: 10px 0 0; font-size: 16px;">Yêu cầu khôi phục tài khoản</p>
            </div>

            <div style="background: linear-gradient(135deg, #f0f9ff, #f0fdfa); padding: 30px; border-radius: 16px; border-left: 5px solid #14b8a6; margin-bottom: 35px; position: relative;">
                <div style="position: absolute; top: -12px; right: 20px; background: linear-gradient(135deg, #3b82f6, #14b8a6); color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600;">
                    SECURE REQUEST
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #3b82f6, #14b8a6); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                    </div>
                    <div>
                        <p style="color: #1e293b; margin: 0; font-size: 18px; font-weight: 600;">
                            Xin chào, <span style="background: linear-gradient(135deg, #3b82f6, #14b8a6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 700;">${patient.name || "bạn"}</span>!
                        </p>
                    </div>
                </div>
                <p style="color: #475569; margin: 0; font-size: 16px; line-height: 1.7;">
                    Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản MediCare của bạn. 
                    Để đảm bảo bảo mật, vui lòng nhấp vào nút bên dưới để tạo mật khẩu mới.
                </p>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 45px 0;">
                <div style="position: relative; display: inline-block;">
                    <div style="position: absolute; inset: -4px; background: linear-gradient(135deg, #3b82f6, #14b8a6); border-radius: 50px; opacity: 0.15; filter: blur(12px);"></div>
                    <a href="${resetLink}" style="position: relative; display: inline-block; background: linear-gradient(135deg, #3b82f6, #14b8a6); color: white; padding: 18px 40px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 17px; box-shadow: 0 12px 35px rgba(59, 130, 246, 0.25); transition: all 0.3s ease; border: none;">
                        <span style="display: flex; align-items: center; justify-content: center;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style="margin-right: 10px;">
                                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                            </svg>
                            Đặt Lại Mật Khẩu
                        </span>
                    </a>
                </div>
            </div>

            <!-- Security Info -->
            <div style="background: linear-gradient(135deg, #fef3c7, #fef7cd); border: 2px solid #f59e0b; border-radius: 16px; padding: 25px; margin: 35px 0; position: relative;">
                <div style="position: absolute; top: -12px; left: 20px; background: #f59e0b; color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600;">
                    ⚠️ BẢO MẬT
                </div>
                <div style="margin-top: 8px;">
                    <h4 style="color: #92400e; margin: 0 0 12px; font-weight: 700; font-size: 15px;">Thông tin quan trọng:</h4>
                    <div style="color: #b45309; font-size: 14px; line-height: 1.6;">
                        <div style="display: flex; align-items: center; margin-bottom: 8px;">
                            <span style="margin-right: 8px;">⏱️</span>
                            <span>Liên kết sẽ hết hạn sau <strong>60 phút</strong></span>
                        </div>
                        <div style="display: flex; align-items: center; margin-bottom: 8px;">
                            <span style="margin-right: 8px;">🔒</span>
                            <span>Chỉ sử dụng một lần duy nhất</span>
                        </div>
                        <div style="display: flex; align-items: center;">
                            <span style="margin-right: 8px;">📞</span>
                            <span>Liên hệ hỗ trợ: <strong>(028) 3xxx-xxxx</strong></span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Alternative Link -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
                <p style="color: #64748b; margin: 0 0 12px; font-size: 14px; font-weight: 500;">Nếu nút không hoạt động, hãy sao chép liên kết này:</p>
                <div style="background: white; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 15px; margin: 10px 0;">
                    <p style="color: #3b82f6; font-size: 12px; word-break: break-all; margin: 0; font-family: 'Courier New', monospace;">
                    ${resetLink}
                    </p>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div style="background: linear-gradient(135deg, #3b82f6, #14b8a6); padding: 35px; text-align: center; color: white; position: relative;">
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);"></div>
            
            <div style="margin-bottom: 25px;">
                <div style="width: 50px; height: 3px; background: rgba(255,255,255,0.3); margin: 0 auto 20px; border-radius: 2px;"></div>
                <p style="margin: 0; font-weight: 600; font-size: 16px; opacity: 0.9;">Trân trọng,</p>
                <p style="margin: 8px 0 0; font-weight: 800; font-size: 20px;">
                    Đội Ngũ <span style="color: #14b8a6;">MediCare</span>
                </p>
            </div>
            
            <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 20px; opacity: 0.8;">
                <p style="margin: 0 0 8px; font-size: 13px;">
                    📧 support@medicare.vn | 📞 (028) 3xxx-xxxx | 🌐 medicare.vn
                </p>
                <p style="margin: 0; font-size: 11px; opacity: 0.7;">
                    © 2025 MediCare. Bảo vệ sức khỏe - Tin cậy công nghệ
                </p>
            </div>
        </div>
    </div>
</body>
    `;
        try {
            yield (0, utils_1.sendMail)({ to: email, subject, html });
        }
        catch (mailErr) {
            console.error("Send mail error:", mailErr);
        }
        res.status(200).json({
            success: true,
            message: "Liên kết đặt lại mật khẩu đã được tạo. Vui lòng kiểm tra email (nếu không nhận được, dùng resetLink bên dưới).",
            token, // dev only
            expiresAt: expires.toISOString(),
            resetLink,
        });
    }
    catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
});
exports.forgotPassword = forgotPassword;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            res
                .status(400)
                .json({ success: false, message: "Token và mật khẩu là bắt buộc" });
            return;
        }
        const patient = yield Patient_1.default.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() },
        });
        if (!patient) {
            res.status(400).json({
                success: false,
                message: "Token không hợp lệ hoặc đã hết hạn",
            });
            return;
        }
        patient.password = password;
        patient.resetPasswordToken = undefined;
        patient.resetPasswordExpires = undefined;
        yield patient.save();
        res
            .status(200)
            .json({ success: true, message: "Đặt lại mật khẩu thành công" });
    }
    catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
});
exports.resetPassword = resetPassword;
