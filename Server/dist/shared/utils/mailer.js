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
exports.sendMail = sendMail;
exports.verifyEmailTransport = verifyEmailTransport;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Gửi email thật qua Gmail. Bắt buộc cấu hình EMAIL_USER (Gmail) và EMAIL_PASS (App Password)
const EMAIL_USER = process.env.EMAIL_USER || "";
const EMAIL_PASS = process.env.EMAIL_PASS || "";
const EMAIL_FROM = process.env.MAIL_FROM || EMAIL_USER;
let cachedTransport = null;
function createTransport() {
    return __awaiter(this, void 0, void 0, function* () {
        if (cachedTransport)
            return cachedTransport;
        if (!EMAIL_USER || !EMAIL_PASS) {
            throw new Error("Thiếu cấu hình EMAIL_USER/EMAIL_PASS. Vui lòng thêm vào .env (EMAIL_USER là Gmail, EMAIL_PASS là App Password).");
        }
        const transporter = nodemailer_1.default.createTransport({
            service: "gmail",
            auth: { user: EMAIL_USER, pass: EMAIL_PASS },
            tls: { rejectUnauthorized: false },
        });
        cachedTransport = { transporter };
        return cachedTransport;
    });
}
function sendMail(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const { transporter } = yield createTransport();
        yield transporter.sendMail(Object.assign({ from: EMAIL_FROM || opts.to }, opts));
    });
}
// Giữ hàm trống để tương thích import cũ (không test/verify)
function verifyEmailTransport() {
    return __awaiter(this, void 0, void 0, function* () {
        return;
    });
}
