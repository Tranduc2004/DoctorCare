# Hướng dẫn sử dụng Routes

## Tổng quan
Routes đã được tổ chức theo cấu trúc modules với 3 nhánh chính: Admin, Patient và Doctor.

## 🚀 **API Endpoints**

### **Admin API** - `/api/admin`
Quản lý tổng thể hệ thống

#### **Appointments** - `/api/admin/appointments`
- `GET /` - Lấy tất cả lịch hẹn trong hệ thống
- `PUT /:id/status` - Cập nhật trạng thái lịch hẹn
- `DELETE /:id` - Xóa lịch hẹn
- `GET /stats` - Thống kê lịch hẹn

#### **Users** - `/api/admin/users`
- `GET /` - Lấy tất cả người dùng
- `GET /role/:role` - Lấy người dùng theo role
- `PUT /:id` - Cập nhật thông tin người dùng
- `DELETE /:id` - Xóa người dùng
- `GET /stats` - Thống kê người dùng

### **Patient API** - `/api/patient`
Chức năng cho bệnh nhân

#### **Appointments** - `/api/patient/appointments`
- `POST /` - Tạo lịch hẹn mới
- `GET /` - Lấy lịch hẹn của bệnh nhân
- `PUT /:id/cancel` - Hủy lịch hẹn
- `PUT /:id/symptoms` - Cập nhật triệu chứng

#### **Medical Records** - `/api/patient/medical-records`
- `GET /` - Lấy hồ sơ bệnh án của bệnh nhân
- `GET /:id` - Lấy chi tiết hồ sơ bệnh án
- `GET /history` - Lấy lịch sử khám bệnh

### **Doctor API** - `/api/doctor`
Chức năng cho bác sĩ

#### **Schedule** - `/api/doctor/schedule`
- `POST /` - Tạo lịch làm việc mới
- `GET /available` - Lấy lịch làm việc có sẵn
- `GET /my` - Lấy tất cả lịch làm việc của bác sĩ
- `PUT /:id` - Cập nhật lịch làm việc
- `DELETE /:id` - Xóa lịch làm việc
- `GET /stats` - Thống kê lịch làm việc

#### **Appointments** - `/api/doctor/appointments`
- `GET /` - Lấy lịch hẹn của bác sĩ
- `PUT /:id/status` - Cập nhật trạng thái lịch hẹn
- `GET /by-date` - Lấy lịch hẹn theo ngày
- `GET /stats` - Thống kê lịch hẹn

#### **Medical Records** - `/api/doctor/medical-records`
- `POST /` - Tạo hồ sơ bệnh án mới
- `GET /patient/:patientId` - Lấy hồ sơ bệnh án của bệnh nhân
- `PUT /:id` - Cập nhật hồ sơ bệnh án
- `GET /my` - Lấy tất cả hồ sơ bệnh án của bác sĩ
- `GET /:id` - Lấy chi tiết hồ sơ bệnh án

### **Auth API** - `/api/auth`
Xác thực và quản lý người dùng

- `POST /register` - Đăng ký người dùng mới
- `POST /login` - Đăng nhập
- `GET /profile` - Lấy thông tin profile
- `PUT /profile` - Cập nhật thông tin profile

## 📁 **Cấu trúc Routes**

```
modules/
├── admin/
│   └── routes/
│       ├── index.ts              # Admin routes chính
│       ├── appointmentRoutes.ts  # Routes cho lịch hẹn
│       └── userRoutes.ts         # Routes cho người dùng
├── patient/
│   └── routes/
│       ├── index.ts              # Patient routes chính
│       ├── appointmentRoutes.ts  # Routes cho lịch hẹn
│       └── medicalRecordRoutes.ts # Routes cho hồ sơ bệnh án
└── doctor/
    └── routes/
        ├── index.ts              # Doctor routes chính
        ├── scheduleRoutes.ts     # Routes cho lịch làm việc
        ├── appointmentRoutes.ts  # Routes cho lịch hẹn
        └── medicalRecordRoutes.ts # Routes cho hồ sơ bệnh án
```

## 🔒 **Bảo mật**

- Tất cả routes đều cần xác thực (trừ auth)
- Kiểm tra quyền truy cập dựa trên role
- Validation dữ liệu đầu vào
- Rate limiting cho các API quan trọng

## 📝 **Ghi chú**

- Mỗi module có routes riêng biệt
- Routes được tổ chức theo chức năng
- Dễ dàng thêm/sửa/xóa routes
- Có thể áp dụng middleware riêng cho từng module
