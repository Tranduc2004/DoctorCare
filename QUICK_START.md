# Hướng dẫn nhanh - Admin Panel

## 🚀 Khởi động nhanh

### 1. Khởi động Server

```bash
cd Server
npm install
npm run dev
```

### 2. Khởi tạo dữ liệu mẫu

```bash
cd Server
node scripts/initData.js
```

### 3. Khởi động Admin Panel

```bash
cd admin
npm install
npm run dev
```

### 4. Truy cập

- Admin Panel: http://localhost:5173
- Server API: http://localhost:5000

## 📋 Dữ liệu mẫu được tạo

### Chuyên khoa (14 chuyên khoa)

- Tim mạch, Nội tổng quát, Ngoại tổng quát
- Nhi khoa, Sản phụ khoa, Da liễu
- Mắt, Tai mũi họng, Răng hàm mặt
- Xương khớp, Thần kinh, Tâm thần
- Ung bướu, Y học cổ truyền

### Dịch vụ (5 dịch vụ)

- Khám tổng quát: 200,000 VND (30 phút)
- Khám chuyên khoa: 300,000 VND (45 phút)
- Khám sức khỏe định kỳ: 500,000 VND (60 phút)
- Tư vấn dinh dưỡng: 150,000 VND (30 phút)
- Tư vấn tâm lý: 250,000 VND (45 phút)

## 🎯 Tính năng chính

- ✅ Quản lý chuyên khoa (CRUD)
- ✅ Quản lý dịch vụ (CRUD)
- ✅ Tìm kiếm và lọc
- ✅ Bật/tắt trạng thái
- ✅ Giao diện responsive
- ✅ Xác thực admin

## 🔧 Xử lý lỗi

Nếu gặp lỗi TypeScript:

1. Kiểm tra server đã chạy chưa
2. Chạy lại script khởi tạo dữ liệu
3. Kiểm tra kết nối MongoDB

## 📱 Giao diện

- **Sidebar**: Menu điều hướng
- **Dashboard**: Tổng quan hệ thống
- **Specialties**: Quản lý chuyên khoa
- **Services**: Quản lý dịch vụ
- **Patients**: Quản lý bệnh nhân
- **Doctors**: Quản lý bác sĩ
