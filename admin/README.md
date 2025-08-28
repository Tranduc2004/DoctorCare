# Admin Frontend

## Overview

Admin frontend được xây dựng với React + TypeScript + Vite để quản lý hệ thống lịch hẹn khám bệnh.

## Cấu trúc thư mục

```
src/
├── api/                    # API calls
│   └── adminApi.ts        # Admin API functions
├── components/             # Reusable components
├── contexts/               # React contexts
│   └── AdminAuthContext.tsx # Admin authentication context
├── pages/                  # Page components
│   ├── Login.tsx          # Login page
│   ├── Login.css          # Login page styles
│   ├── Dashboard.tsx      # Dashboard page
│   └── Dashboard.css      # Dashboard page styles
├── types/                  # TypeScript type definitions
│   └── admin.ts           # Admin types
├── App.tsx                 # Main app component
└── main.tsx               # Entry point
```

## Tính năng

- **Đăng nhập admin**: Xác thực với username/password
- **Dashboard**: Hiển thị thống kê tổng quan và thao tác nhanh
- **Protected Routes**: Bảo vệ các trang yêu cầu đăng nhập
- **Responsive Design**: Giao diện thân thiện với mobile

## Cách sử dụng

### Cài đặt dependencies
```bash
npm install
```

### Chạy development server
```bash
npm run dev
```

### Build production
```bash
npm run build
```

## API Endpoints

- `POST /api/admin/auth/login` - Đăng nhập admin
- `GET /api/admin/auth/profile` - Lấy thông tin admin (cần token)

## Tài khoản mặc định

- **Username**: admin
- **Password**: admin123

## Công nghệ sử dụng

- React 18
- TypeScript
- Vite
- React Router DOM
- Axios
- CSS Modules
