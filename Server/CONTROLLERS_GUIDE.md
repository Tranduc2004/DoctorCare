# Hướng dẫn sử dụng Controllers

## Tổng quan

Các controllers đã được phân bố vào 3 modules chính và shared theo chức năng:

## 📋 **Admin Module Controllers**

### `appointmentController.ts`

- **`getAllAppointments`**: Lấy tất cả lịch hẹn trong hệ thống
- **`updateAppointmentStatus`**: Cập nhật trạng thái lịch hẹn
- **`deleteAppointment`**: Xóa lịch hẹn
- **`getAppointmentStats`**: Thống kê lịch hẹn

### `userController.ts`

- **`getAllUsers`**: Lấy tất cả người dùng
- **`getUsersByRole`**: Lấy người dùng theo role
- **`updateUser`**: Cập nhật thông tin người dùng
- **`deleteUser`**: Xóa người dùng
- **`getUserStats`**: Thống kê người dùng

## 🏥 **Patient Module Controllers**

### `appointmentController.ts`

- **`createAppointment`**: Tạo lịch hẹn mới
- **`getPatientAppointments`**: Lấy lịch hẹn của bệnh nhân
- **`cancelAppointment`**: Hủy lịch hẹn
- **`updateSymptoms`**: Cập nhật triệu chứng

### `medicalRecordController.ts`

- **`getPatientMedicalRecords`**: Lấy hồ sơ bệnh án của bệnh nhân
- **`getMedicalRecordDetail`**: Lấy chi tiết hồ sơ bệnh án
- **`getPatientHistory`**: Lấy lịch sử khám bệnh

## 👨‍⚕️ **Doctor Module Controllers**

### `scheduleController.ts`

- **`createSchedule`**: Tạo lịch làm việc mới
- **`getDoctorSchedules`**: Lấy lịch làm việc của bác sĩ
- **`getMySchedules`**: Lấy tất cả lịch làm việc của bác sĩ
- **`updateSchedule`**: Cập nhật lịch làm việc
- **`deleteSchedule`**: Xóa lịch làm việc
- **`getScheduleStats`**: Thống kê lịch làm việc

### `appointmentController.ts`

- **`getDoctorAppointments`**: Lấy lịch hẹn của bác sĩ
- **`updateAppointmentStatus`**: Cập nhật trạng thái lịch hẹn
- **`getAppointmentsByDate`**: Lấy lịch hẹn theo ngày
- **`getAppointmentStats`**: Thống kê lịch hẹn

### `medicalRecordController.ts`

- **`createMedicalRecord`**: Tạo hồ sơ bệnh án mới
- **`getPatientMedicalRecords`**: Lấy hồ sơ bệnh án của bệnh nhân
- **`updateMedicalRecord`**: Cập nhật hồ sơ bệnh án
- **`getDoctorMedicalRecords`**: Lấy tất cả hồ sơ bệnh án của bác sĩ
- **`getMedicalRecordDetail`**: Lấy chi tiết hồ sơ bệnh án

## 🔐 **Shared Controllers**

### `authController.ts`

- **`register`**: Đăng ký người dùng mới
- **`login`**: Đăng nhập
- **`getProfile`**: Lấy thông tin profile
- **`updateProfile`**: Cập nhật thông tin profile

## 🚀 **Cách sử dụng**

### 1. Import Controllers

```typescript
// Trong admin routes
import {
  getAllAppointments,
  updateAppointmentStatus,
  getAllUsers,
} from "../controllers";

// Trong patient routes
import { createAppointment, getPatientAppointments } from "../controllers";

// Trong doctor routes
import { createSchedule, getDoctorAppointments } from "../controllers";
```

### 2. Sử dụng trong Routes

```typescript
// Admin routes
router.get("/appointments", getAllAppointments);
router.put("/appointments/:id/status", updateAppointmentStatus);
router.get("/users", getAllUsers);

// Patient routes
router.post("/appointments", createAppointment);
router.get("/appointments", getPatientAppointments);

// Doctor routes
router.post("/schedule", createSchedule);
router.get("/appointments", getDoctorAppointments);
```

## 🔒 **Bảo mật**

- Mỗi controller đều có validation cơ bản
- Kiểm tra quyền truy cập dựa trên role
- Xác thực người dùng trước khi thực hiện các thao tác

## 📝 **Ghi chú**

- Tất cả controllers đều sử dụng async/await
- Error handling được thực hiện nhất quán
- Response format được chuẩn hóa
- Logs được ghi lại để debug
