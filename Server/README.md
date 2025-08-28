# Server Structure

## Overview

Server được tổ chức theo mô hình modules với 3 nhánh chính: Admin, Patient và Doctor.

## Cấu trúc thư mục

```
src/
├── modules/                    # Các module chính
│   ├── admin/                 # Module quản trị
│   │   ├── controllers/       # Controllers cho admin
│   │   ├── routes/           # Routes cho admin
│   │   ├── services/         # Business logic cho admin
│   │   └── middlewares/      # Middlewares riêng cho admin
│   ├── patient/              # Module bệnh nhân
│   │   ├── controllers/      # Controllers cho bệnh nhân
│   │   ├── routes/          # Routes cho bệnh nhân
│   │   ├── services/        # Business logic cho bệnh nhân
│   │   └── middlewares/     # Middlewares riêng cho bệnh nhân
│   └── doctor/              # Module bác sĩ
│       ├── controllers/     # Controllers cho bác sĩ
│       ├── routes/         # Routes cho bác sĩ
│       ├── services/       # Business logic cho bác sĩ
│       └── middlewares/    # Middlewares riêng cho bác sĩ
├── shared/                   # Các thành phần dùng chung
│   ├── models/              # Database models
│   ├── controllers/         # Controllers dùng chung (auth)
│   ├── routes/              # Routes dùng chung (auth)
│   ├── middlewares/         # Middlewares dùng chung
│   ├── utils/               # Utility functions
│   └── types/               # TypeScript type definitions
├── config/                   # Cấu hình
└── index.ts                  # Entry point chính
```

## API Endpoints

### Admin API

- Base URL: `/api/admin`
- Quản lý người dùng, lịch hẹn, bác sĩ

### Patient API

- Base URL: `/api/patient`
- Quản lý lịch hẹn, hồ sơ bệnh án

### Doctor API

- Base URL: `/api/doctor`
- Quản lý lịch làm việc, lịch hẹn, hồ sơ bệnh án

### Auth API

- Base URL: `/api/auth`
- Đăng ký, đăng nhập, quản lý profile

## Cách sử dụng

1. Mỗi module có thể hoạt động độc lập
2. Shared components được sử dụng chung giữa các modules
3. Mỗi module có thể có business logic riêng
4. Middlewares có thể được áp dụng ở cấp module hoặc global

## Lợi ích

- **Dễ bảo trì**: Mỗi module có trách nhiệm riêng biệt
- **Dễ mở rộng**: Thêm module mới không ảnh hưởng module cũ
- **Tái sử dụng**: Shared components có thể dùng chung
- **Rõ ràng**: Cấu trúc rõ ràng, dễ hiểu
- **Testable**: Mỗi module có thể test riêng biệt

## Migration Notes

- Các controllers và routes cũ đã được phân bố vào modules mới
- Auth controller và routes được chuyển vào shared để dùng chung
- Cấu trúc cũ đã được dọn dẹp hoàn toàn
- Tất cả chức năng được giữ nguyên, chỉ thay đổi vị trí
- Multer upload vẫn được giữ lại cho việc upload license
