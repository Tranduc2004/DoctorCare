Quy tắc Phát triển Hệ thống - Chế độ DIRECT Mode
Tài liệu này định nghĩa và bắt buộc áp dụng kiến trúc DIRECT Mode cho toàn bộ hệ thống, bao gồm admin-server (port 5000) và pharmacy-server (port 5001).

Mục tiêu của DIRECT Mode là đảm bảo mỗi server hoạt động hoàn toàn độc lập, không phụ thuộc vào sự tồn tại hay địa chỉ của server khác, nhằm tối ưu hóa việc phát triển, triển khai và bảo trì.

Triết lý Cốt lõi
Độc lập (Independence): Mỗi server là một khối đơn nhất. admin-server không biết pharmacy-server là ai và ngược lại.

Nguồn chân lý chung (Single Source of Truth): Toàn bộ logic nghiệp vụ, mô hình dữ liệu (models), và schemas được quản lý tập trung tại một package shared duy nhất: @medicare/pharmacy-domain.

Truy cập Trực tiếp (Direct Access): Mỗi server kết nối và thao tác trực tiếp với cơ sở dữ liệu MongoDB, thay vì ủy quyền hay yêu cầu dữ liệu từ một server khác.

Các Quy tắc Bất di bất dịch (Nghiêm cấm)
Mọi Pull Request vi phạm các quy tắc dưới đây sẽ bị từ chối.

NGHIÊM CẤM Giao tiếp Server-to-Server:

Tuyệt đối không được phép gọi API (HTTP/RPC) từ server này sang server kia.

Không sử dụng axios, node-fetch, hoặc bất kỳ thư viện HTTP client nào để gọi nội bộ.

Không cấu hình proxy (ví dụ: http-proxy-middleware) để chuyển tiếp request.

NGHIÊM CẤM Phụ thuộc Cấu hình (Environment):

Không được thêm bất kỳ biến môi trường (environment variables) nào chứa địa chỉ hoặc port của server còn lại.

Ví dụ: Cấm các biến như ADMIN_SERVICE_URL, PHARMACY_API_ENDPOINT, v.v.

NGHIÊM CẤM Định nghĩa Model Trùng lặp:

Không được tự định nghĩa Schema hay Model (ví dụ: ProductSchema, CategoryModel) bên trong code của admin-server hoặc pharmacy-server.

Không sử dụng mongoose.models để "tìm" model. Phải luôn import tường minh từ shared package.

Các Quy tắc Bắt buộc (Phải làm)

1. Gói Shared Domain (@medicare/pharmacy-domain)
   Đây là trái tim của hệ thống. Tất cả logic chung phải được đặt tại đây.

Nơi chứa: Models, Schemas, Services (logic nghiệp vụ), enums, và DTOs/types.

Ví dụ: Các file product.model.js, category.service.js, inventory.schema.js, manufacturer.model.js... đều phải nằm trong package này.

Cách sử dụng: Cả hai server phải import trực tiếp từ package này.

JavaScript

// ✅ ĐÚNG: Import trực tiếp từ shared package
import {
ProductModel,
InventoryService,
} from '@medicare/pharmacy-domain';

// ❌ SAI: Tự định nghĩa hoặc dùng model của Mongoose
// const ProductModel = mongoose.model('Product');
// const ProductSchema = new mongoose.Schema({...}); 2. Kết nối Cơ sở dữ liệu
Mỗi server PHẢI tự mình thực thi logic kết nối đến MongoDB khi khởi động.

Việc này phải được thực hiện độc lập tại mỗi server (ví dụ: trong file server.js hoặc config/db.js của từng dự án).

Server không được phép "dùng chung" kết nối từ một server khác.

Mỗi server sẽ đọc chuỗi kết nối (process.env.MONGO_URI) từ file .env của chính nó và thực thi logic kết nối (ví dụ: mongoose.connect) với dbName: "CareDoctor".

Quan trọng: Chỉ sau khi kết nối thành công, server mới được bắt đầu nhận request hoặc sử dụng các Model.

3. Quy chuẩn API và Controller
   Tất cả các API endpoints phải tuân thủ nghiêm ngặt các tiêu chuẩn sau:

a. Cấu trúc Phản hồi (Response Structure): Tất cả response (kể cả lỗi) phải dùng ApiResponse chuẩn.

TypeScript

// Interface chuẩn
interface ApiResponse<T> {
success: boolean;
data?: T;
error?: string; // Mã lỗi (ví dụ: 'VALIDATION_ERROR')
message?: string; // Thông điệp cho client
}

// ✅ 200 OK
res
.status(200)
.json({ success: true, data: { user }, message: 'Login successful' });

// ❌ 400 Bad Request
res
.status(400)
.json({ success: false, error: 'INVALID_INPUT', message: 'Email is required' });

// ❌ 404 Not Found
res
.status(404)
.json({ success: false, error: 'NOT_FOUND', message: 'Product not found' });

// ❌ 500 Server Error
res.status(500).json({
success: false,
error: 'INTERNAL_ERROR',
message: 'An unexpected error occurred',
});
b. Bảo mật (RBAC Middleware): Mọi route phải được bảo vệ.

admin-server: Sử dụng authAdmin (hoặc middleware RBAC tương ứng).

pharmacy-server: Sử dụng authStaff (hoặc middleware RBAC tương ứng).

c. Phân trang (Pagination): Mọi API lấy danh sách phải có phân trang và được validate chặt chẽ.

page: Phải >= 1.

limit: Phải nằm trong khoảng hợp lệ (ví dụ: 1 <= limit <= 100).

d. Logging & Truy vết (Tracing): Khi ghi log, phải kiểm tra và đính kèm x-request-id từ header (nếu có) để phục vụ việc truy vết (traceability).

JavaScript

// Ví dụ trong một middleware hoặc controller
const requestId = req.headers['x-request-id'];
logger.error(
`[${requestId || 'N/A'}] Error fetching products: ${err.message}`
);
Luồng Phát triển (Development Workflow)
Tình huống: Cần thêm chức năng "Quản lý Nhà sản xuất (Manufacturer)".

❌ Cách làm SAI:

admin-server tạo API POST /manufacturers.

pharmacy-server cần xem danh sách nhà sản xuất.

Lập trình viên pharmacy-server dùng axios gọi sang admin-server để lấy dữ liệu.

✅ Cách làm ĐÚNG (DIRECT Mode):

Bước 1 (Shared Package): Mở project @medicare/pharmacy-domain.

Bước 2 (Shared Package): Định nghĩa manufacturer.schema.js, manufacturer.model.js.

Bước 3 (Shared Package): (Tùy chọn) Viết manufacturer.service.js nếu có logic phức tạp.

Bước 4 (Shared Package): Export ManufacturerModel và ManufacturerService từ index.js của package.

Bước 5 (Shared Package): Publish phiên bản mới cho package.

Bước 6 (Servers): Cả admin-server và pharmacy-server chạy npm update @medicare/pharmacy-domain.

Bước 7 (admin-server):

import { ManufacturerModel } from '@medicare/pharmacy-domain';

Tạo controller và route (ví dụ: POST /manufacturers, PUT /manufacturers/:id) sử dụng ManufacturerModel để thao tác trực tiếp với MongoDB.

Bước 8 (pharmacy-server):

import { ManufacturerModel } from '@medicare/pharmacy-domain';

Tạo controller và route (ví dụ: GET /manufacturers) sử dụng ManufacturerModel để đọc trực tiếp từ MongoDB.

---

## ⚠️ Các Lỗi Thường Gặp và Cách Phòng Tránh

### 1. Lỗi "toObject is not a function"

**Nguyên nhân**: Service sử dụng `.lean()` trả về plain objects, nhưng controller gọi `.toObject()` trên Mongoose documents.

**Triệu chứng**:

```
TypeError: category.toObject is not a function
```

**Cách phòng tránh**:

- **Option 1**: Xóa `.lean()` trong Service để trả về Mongoose documents
- **Option 2**: Sửa controller để xử lý cả hai trường hợp:

```typescript
// ✅ AN TOÀN: Xử lý cả Mongoose documents và plain objects
return {
  ...(category.toObject ? category.toObject() : category),
  medicineCount,
};
```

### 2. Lỗi "Duplicate schema index"

**Nguyên nhân**: Định nghĩa index ở cả 2 nơi:

- `unique: true` trong schema (tự động tạo index)
- `.index()` thủ công

**Triệu chứng**:

```
[MONGOOSE] Warning: Duplicate schema index on {"code":1} found
```

**Cách phòng tránh**:

- **KHÔNG** định nghĩa `.index()` cho fields đã có `unique: true`
- **CHỈ** định nghĩa `.index()` cho fields cần index nhưng không unique

```typescript
// ❌ SAI: Duplicate index
const schema = new Schema({
  code: { type: String, unique: true }, // Tự động tạo index
});
schema.index({ code: 1 }); // Duplicate!

// ✅ ĐÚNG: Chỉ một index
const schema = new Schema({
  code: { type: String, unique: true }, // Tự động tạo index
});
schema.index({ status: 1 }); // Index khác
```

### 3. Lỗi Mongoose Version Conflict

**Nguyên nhân**: Shared package và Server sử dụng phiên bản Mongoose khác nhau.

**Triệu chứng**:

```
TypeError: s._gatherChildSchemas is not a function
```

**Cách phòng tránh**:

- **Đồng bộ** phiên bản Mongoose trong tất cả packages
- **Kiểm tra** `package.json` của shared và các server
- **Cập nhật** dependencies khi có conflict

### 4. Lỗi Import Model Trực Tiếp

**Nguyên nhân**: Import model trực tiếp từ shared thay vì sử dụng factory function.

**Triệu chứng**:

```
500 Internal Server Error
Operation buffering timed out
```

**Cách phòng tránh**:

```typescript
// ❌ SAI: Import model trực tiếp
import { Medicine } from "@medicare/shared";

// ✅ ĐÚNG: Sử dụng factory function
import { getMedicineModel } from "@medicare/shared";
import mongoose from "mongoose";

export const MedicineModel = getMedicineModel(mongoose.connection);
```

### 5. Checklist Kiểm Tra Trước Deploy

- [ ] Tất cả models sử dụng factory functions
- [ ] Không có duplicate index warnings
- [ ] Mongoose versions đồng bộ
- [ ] Controllers xử lý cả Mongoose documents và plain objects
- [ ] Database connection được khởi tạo trước khi sử dụng models
- [ ] API responses tuân thủ `ApiResponse` interface
