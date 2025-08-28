1. Luồng tổng quan đặt lịch khám

Bác sĩ tạo lịch trống (availability/schedule).

Bệnh nhân chọn khung giờ còn trống → gửi yêu cầu đặt lịch.

Backend kiểm tra trùng lịch → tạo record appointment (status = pending).

Bác sĩ xác nhận (hoặc auto-confirm).

Bệnh nhân nhận thông báo (email/notification).

Đến giờ hẹn → join phòng chat/video.

2. Database cần có
   Bảng users (chung cho cả admin, doctor, patient)
   {
   id: string,
   role: "admin" | "doctor" | "patient",
   name: string,
   email: string,
   password: string,
   specialty?: string, // nếu là doctor
   bio?: string, // nếu là doctor
   createdAt: Date,
   }

Bảng doctor_schedules

Lịch trống do bác sĩ tạo.

{
id: string,
doctorId: string,
date: string, // 2025-08-26
startTime: string, // "09:00"
endTime: string, // "10:00"
isBooked: boolean
}

Bảng appointments

Thông tin buổi hẹn.

{
id: string,
patientId: string,
doctorId: string,
scheduleId: string, // tham chiếu đến doctor_schedules
status: "pending" | "confirmed" | "cancelled" | "done",
createdAt: Date,
updatedAt: Date
}

3. API Backend cần có
   Doctor side 🧑‍⚕️

POST /doctor/schedules → tạo lịch trống.

GET /doctor/schedules → xem lịch trống của mình.

PATCH /doctor/schedules/:id → chỉnh sửa/xóa lịch trống.

GET /doctor/appointments → xem các buổi hẹn với bệnh nhân.

PATCH /doctor/appointments/:id → confirm / cancel.

Patient side 👩‍⚕️

GET /doctors → danh sách bác sĩ.

GET /doctor/:id/schedules → xem lịch trống của bác sĩ.

POST /appointments → đặt lịch (chọn scheduleId).

GET /appointments → xem lịch đã đặt.

Admin side 🛠️

GET /appointments/all → xem toàn bộ lịch hẹn.

PATCH /appointments/:id → can thiệp khi cần (force confirm / cancel).

GET /stats/appointments → thống kê số ca khám.

4. Luồng chi tiết ví dụ
   Bác sĩ tạo lịch

Doctor A tạo lịch: 30/08/2025 - 09:00 → 10:00.

Backend lưu vào doctor_schedules với isBooked=false.

Bệnh nhân đặt lịch

Patient B vào profile bác sĩ A → thấy khung giờ trống.

Chọn khung giờ → POST /appointments { doctorId, scheduleId }.

Backend kiểm tra isBooked=false → tạo appointment (status=pending), update doctor_schedules.isBooked=true.

Bác sĩ xác nhận

Doctor A vào dashboard → thấy appointment từ Patient B.

PATCH /doctor/appointments/:id { status: confirmed }.

Backend update appointment status = confirmed.

Đến ngày khám

Hệ thống gửi thông báo (email / socket).

Bác sĩ & bệnh nhân join phòng video/chat.

5. Frontend flow

Patient:
Trang "Tìm bác sĩ" → chọn bác sĩ → xem lịch trống → chọn giờ → đặt lịch.

Doctor:
Trang "Lịch của tôi" → thêm khung giờ trống → xem yêu cầu → xác nhận.

Admin:
Trang "Quản lý lịch hẹn" → xem tất cả → chỉnh sửa khi cần.
