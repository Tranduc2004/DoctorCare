import nodemailer from "nodemailer";

const EMAIL_USER = process.env.EMAIL_USER || "";
const EMAIL_PASS = process.env.EMAIL_PASS || "";
const EMAIL_FROM = process.env.MAIL_FROM || EMAIL_USER;

function createTransport() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    tls: { rejectUnauthorized: false },
  });
}

export async function verifyEmailTransport(): Promise<void> {
  console.log("Đang khởi tạo transporter email...");
  console.log("EMAIL_USER:", EMAIL_USER || "(trống)");
  console.log("EMAIL_PASS:", EMAIL_PASS ? "Đã cấu hình" : "Chưa cấu hình");

  if (!EMAIL_USER || !EMAIL_PASS) {
    console.error(
      "Lỗi: EMAIL_USER hoặc EMAIL_PASS chưa được cấu hình trong file .env"
    );
    return; // Không ném lỗi để server vẫn chạy
  }

  const transporter = createTransport();
  try {
    await transporter.verify();
    console.log("Kết nối email thành công");
  } catch (error) {
    console.error("Lỗi kết nối email:", error);
  }
}

type SendMailOptions = {
  to: string;
  subject: string;
  html: string;
};

export async function sendMail(options: SendMailOptions): Promise<void> {
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
    await transporter.sendMail({ from: EMAIL_FROM || to, to, subject, html });
  } catch (error) {
    console.error("Gửi mail thất bại:", error);
  }
}
