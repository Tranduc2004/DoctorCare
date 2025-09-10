# Hướng dẫn sử dụng hệ thống quản lý Dịch vụ và Chuyên khoa

## Tổng quan
Hệ thống này cho phép admin quản lý các dịch vụ khám và chuyên khoa trong phòng khám. Các bác sĩ sẽ chọn chuyên khoa từ dữ liệu do admin quản lý thay vì sử dụng dữ liệu tĩnh.

## Cấu trúc API

### 1. Quản lý Dịch vụ (Services)

#### Endpoints:
- `GET /api/admin/services` - Lấy tất cả dịch vụ
- `GET /api/admin/services/:id` - Lấy dịch vụ theo ID
- `POST /api/admin/services` - Tạo dịch vụ mới
- `PUT /api/admin/services/:id` - Cập nhật dịch vụ
- `DELETE /api/admin/services/:id` - Xóa dịch vụ (soft delete)
- `DELETE /api/admin/services/:id/hard` - Xóa hoàn toàn dịch vụ
- `GET /api/admin/services/search?q=keyword` - Tìm kiếm dịch vụ
- `GET /api/admin/services/active/list` - Lấy dịch vụ đang hoạt động

#### Dữ liệu dịch vụ:
```json
{
  "name": "Khám tổng quát",
  "description": "Khám sức khỏe tổng quát, kiểm tra các chỉ số cơ bản",
  "price": 200000,
  "duration": 30,
  "isActive": true
}
```

### 2. Quản lý Chuyên khoa (Specialties)

#### Endpoints Admin:
- `GET /api/admin/specialties` - Lấy tất cả chuyên khoa
- `GET /api/admin/specialties/:id` - Lấy chuyên khoa theo ID
- `POST /api/admin/specialties` - Tạo chuyên khoa mới
- `PUT /api/admin/specialties/:id` - Cập nhật chuyên khoa
- `DELETE /api/admin/specialties/:id` - Xóa chuyên khoa (soft delete)
- `DELETE /api/admin/specialties/:id/hard` - Xóa hoàn toàn chuyên khoa
- `GET /api/admin/specialties/search?q=keyword` - Tìm kiếm chuyên khoa
- `GET /api/admin/specialties/active/list` - Lấy chuyên khoa đang hoạt động

#### Endpoints Công khai (cho Client):
- `GET /api/specialties/active` - Lấy chuyên khoa đang hoạt động
- `GET /api/specialties/:id` - Lấy thông tin chuyên khoa theo ID

#### Dữ liệu chuyên khoa:
```json
{
  "name": "Tim mạch",
  "description": "Chuyên khoa về các bệnh lý tim mạch, huyết áu, suy tim...",
  "isActive": true
}
```

## Khởi tạo dữ liệu mẫu

### Chạy script khởi tạo:
```bash
cd Server
npm run build
node dist/scripts/initData.js
```

Hoặc chạy trực tiếp TypeScript:
```bash
cd Server
npx ts-node src/scripts/initData.ts
```

Script này sẽ tạo:
- 14 chuyên khoa mẫu
- 5 dịch vụ khám mẫu

## Sử dụng trong Client

### 1. Import API:
```typescript
import specialtyApi from '../api/specialtyApi';
```

### 2. Lấy danh sách chuyên khoa:
```typescript
const specialties = await specialtyApi.getActiveSpecialties();
```

### 3. Sử dụng trong form:
```typescript
{specialties.map((specialty) => (
  <option key={specialty._id} value={specialty.name}>
    {specialty.name}
  </option>
))}
```

## Lưu ý quan trọng

1. **Xác thực**: Tất cả endpoints admin đều yêu cầu xác thực admin
2. **Soft Delete**: Mặc định sử dụng soft delete để tránh mất dữ liệu
3. **Validation**: Hệ thống có validation đầy đủ cho dữ liệu đầu vào
4. **Search**: Hỗ trợ tìm kiếm full-text với MongoDB text index
5. **Error Handling**: Xử lý lỗi chi tiết với thông báo tiếng Việt

## Ví dụ sử dụng

### Tạo dịch vụ mới:
```bash
curl -X POST http://localhost:5000/api/admin/services \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Khám chuyên khoa",
    "description": "Khám với bác sĩ chuyên môn",
    "price": 300000,
    "duration": 45
  }'
```

### Tạo chuyên khoa mới:
```bash
curl -X POST http://localhost:5000/api/admin/specialties \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dermatology",
    "description": "Chuyên khoa da liễu"
  }'
```

## Cập nhật từ dữ liệu tĩnh

Để chuyển từ dữ liệu tĩnh sang API:

1. Xóa import `SPECIALTIES` từ constants
2. Thay thế bằng API call `specialtyApi.getActiveSpecialties()`
3. Cập nhật state và loading handling
4. Sử dụng `specialty._id` làm key thay vì `specialty`

Hệ thống này giúp admin có thể quản lý linh hoạt các dịch vụ và chuyên khoa mà không cần deploy lại code.
