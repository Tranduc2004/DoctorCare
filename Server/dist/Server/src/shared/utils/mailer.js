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
exports.verifyEmailTransport = verifyEmailTransport;
exports.sendMail = sendMail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const EMAIL_USER = process.env.EMAIL_USER || "";
const EMAIL_PASS = process.env.EMAIL_PASS || "";
const EMAIL_FROM = process.env.MAIL_FROM || EMAIL_USER;
function createTransport() {
    return nodemailer_1.default.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: { user: EMAIL_USER, pass: EMAIL_PASS },
        tls: { rejectUnauthorized: false },
    });
}
function verifyEmailTransport() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Đang khởi tạo transporter email...");
        console.log("Working directory:", process.cwd());
        console.log("NODE_ENV:", process.env.NODE_ENV);
        console.log("All env EMAIL vars:", {
            EMAIL_USER: process.env.EMAIL_USER,
            EMAIL_PASS: process.env.EMAIL_PASS ? "***hidden***" : undefined,
            MAIL_FROM: process.env.MAIL_FROM,
            MAIL_HOST: process.env.MAIL_HOST,
            MAIL_PORT: process.env.MAIL_PORT,
        });
        console.log("EMAIL_USER:", EMAIL_USER || "(trống)");
        console.log("EMAIL_PASS:", EMAIL_PASS ? "Đã cấu hình" : "Chưa cấu hình");
        if (!EMAIL_USER || !EMAIL_PASS) {
            console.error("Lỗi: EMAIL_USER hoặc EMAIL_PASS chưa được cấu hình trong file .env");
            return; // Không ném lỗi để server vẫn chạy
        }
        const transporter = createTransport();
        try {
            yield transporter.verify();
            console.log("Kết nối email thành công");
        }
        catch (error) {
            console.error("Lỗi kết nối email:", error);
        }
    });
}
function sendMail(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { to, subject, html } = options;
        if (!EMAIL_USER || !EMAIL_PASS) {
            console.log("sendMail noop (thiếu EMAIL_USER/EMAIL_PASS):", {
                to,
                subject,
            });
            return;
        }
        const transporter = createTransport();
        try {
            yield transporter.sendMail({ from: EMAIL_FROM || to, to, subject, html });
        }
        catch (error) {
            console.error("Gửi mail thất bại:", error);
        }
    });
}
