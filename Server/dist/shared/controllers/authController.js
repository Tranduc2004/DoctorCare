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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); background-color: #ffffff;">
        <div style="display: flex; align-items: center; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #eee;">
          <div style="height: 48px; width: 48px; background-color: yellow; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 10px; text-align: center; line-height: 1;">
            <span style="font-size: 24px; display: flex; align-items: center; justify-content: center; height: 100%; width: 100%; margin-top:10px; margin-left:10px;">😀</span>
          </div>
          <div>
            <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #00aaff;">Bacola</h1>
            <p style="margin: 0; font-size: 12px; color: #777;">Online Grocery Shopping Center</p>
          </div>
        </div>

        <h2 style="color: #00aaff; margin-top: 0;">Đặt lại mật khẩu</h2>
        <p>Xin chào ${patient.name || "bạn"},</p>
        <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
        <p>Vui lòng nhấp vào liên kết bên dưới để đặt lại mật khẩu:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="display: inline-block; padding: 12px 25px; background-color: #00aaff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Đặt lại mật khẩu
          </a>
        </div>

        <p style="color: #777; font-size: 14px;">Liên kết này sẽ hết hạn sau 1 giờ.</p>
        <p style="color: #777; font-size: 14px;">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
          <p style="margin-bottom: 5px;">Trân trọng,</p>
          <p style="margin-top: 0; color: #00aaff; font-weight: bold;">Đội ngũ Bacola</p>
        </div>
      </div>
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
