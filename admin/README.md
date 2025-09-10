# Admin Panel - Hệ thống Quản lý Y tế

## Tính năng

### 1. Quản lý Chuyên khoa

- Xem danh sách tất cả chuyên khoa
- Thêm chuyên khoa mới
- Chỉnh sửa thông tin chuyên khoa
- Xóa chuyên khoa
- Tìm kiếm chuyên khoa
- Bật/tắt trạng thái hoạt động

### 2. Quản lý Dịch vụ

- Xem danh sách tất cả dịch vụ
- Thêm dịch vụ mới với thông tin:
  - Tên dịch vụ
  - Mô tả
  - Giá (VND)
  - Thời gian khám (phút)
- Chỉnh sửa thông tin dịch vụ
- Xóa dịch vụ
- Tìm kiếm dịch vụ
- Bật/tắt trạng thái hoạt động

### 3. Quản lý Bệnh nhân

- Xem danh sách bệnh nhân
- Xem chi tiết thông tin bệnh nhân

### 4. Quản lý Bác sĩ

- Xem danh sách bác sĩ
- Quản lý thông tin bác sĩ

### 5. Quản lý Lịch làm việc

- Xem và quản lý lịch làm việc của bác sĩ

## Cách sử dụng

### 1. Khởi động Admin Panel

```bash
cd admin
npm install
npm run dev
```

### 2. Khởi động Server

```bash
cd Server
npm install
npm run dev
```

### 3. Khởi tạo dữ liệu mẫu

```bash
cd Server
node scripts/initData.js
```

### 4. Truy cập Admin Panel

- URL: http://localhost:5173 (hoặc port được chỉ định)
- Đăng nhập với tài khoản admin

## Dữ liệu mẫu

### Chuyên khoa

- Tim mạch
- Nội tổng quát
- Ngoại tổng quát
- Nhi khoa
- Sản phụ khoa
- Da liễu
- Mắt
- Tai mũi họng
- Răng hàm mặt
- Xương khớp
- Thần kinh
- Tâm thần
- Ung bướu
- Y học cổ truyền

### Dịch vụ

- Khám tổng quát (200,000 VND, 30 phút)
- Khám chuyên khoa (300,000 VND, 45 phút)
- Khám sức khỏe định kỳ (500,000 VND, 60 phút)
- Tư vấn dinh dưỡng (150,000 VND, 30 phút)
- Tư vấn tâm lý (250,000 VND, 45 phút)

## Cấu trúc thư mục

```
admin/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   └── AdminLayout.tsx
│   │   └── ui/
│   ├── pages/
│   │   ├── specialties/
│   │   │   └── Specialties.tsx
│   │   ├── services/
│   │   │   └── Services.tsx
│   │   ├── patients/
│   │   ├── doctors/
│   │   └── Dashboard.tsx
│   ├── contexts/
│   │   └── AdminAuthContext.tsx
│   ├── hooks/
│   │   └── useAdminAuth.ts
│   └── App.tsx
└── package.json
```

## API Endpoints

### Chuyên khoa

- `GET /api/admin/specialties` - Lấy danh sách chuyên khoa
- `POST /api/admin/specialties` - Tạo chuyên khoa mới
- `PUT /api/admin/specialties/:id` - Cập nhật chuyên khoa
- `DELETE /api/admin/specialties/:id` - Xóa chuyên khoa

### Dịch vụ

- `GET /api/admin/services` - Lấy danh sách dịch vụ
- `POST /api/admin/services` - Tạo dịch vụ mới
- `PUT /api/admin/services/:id` - Cập nhật dịch vụ
- `DELETE /api/admin/services/:id` - Xóa dịch vụ

## Lưu ý

- Đảm bảo MongoDB đang chạy và có kết nối
- Kiểm tra file `.env` có đúng thông tin kết nối database
- Chạy script khởi tạo dữ liệu mẫu trước khi sử dụng
- Đảm bảo server đang chạy trước khi truy cập admin panel
