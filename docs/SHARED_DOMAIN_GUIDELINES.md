## ⚠️ Quy tắc bắt buộc khi sử dụng Shared Domain

Khi triển khai hệ thống MediCare ở chế độ DIRECT mode, tuyệt đối không được require hoặc import shared domain bằng đường dẫn tương đối như:

```
require("../../../../../shared/dist")
```

hoặc bất kỳ hình thức "bò vào dist" nào khác.

Cách này chỉ nên dùng tạm trong môi trường thử nghiệm cục bộ vì nó dễ gây lỗi khi build hoặc deploy (ví dụ khác cấu trúc thư mục, context Docker, CI/CD).

Thay vào đó, tất cả server (admin, pharmacy, hay bất kỳ module nào khác) phải import shared domain dưới dạng package thực thụ. Shared domain (`@medicare/shared`) cần được đóng gói và build riêng với `dist/` của nó, sau đó:

- Hoặc được publish lên private npm registry (GitHub Packages hoặc npm private);
- Hoặc được liên kết trong monorepo thông qua workspaces;
- Hoặc được thêm làm git submodule nếu làm multi-repo.

Khi đó, mọi nơi trong code chỉ được phép viết:

```ts
import { Medicine, MedicineStock, MedicineService } from "@medicare/shared";
```

Mỗi server phải tự kết nối MongoDB trong file .env

trước khi sử dụng bất kỳ model nào từ shared package. Shared package chỉ nên chứa model, schema, service và interface chung – không gọi database, không tạo kết nối, không phụ thuộc vào môi trường cụ thể.

Việc này giúp các server độc lập hoàn toàn khi deploy, tránh lỗi đường dẫn, dễ quản lý version, hỗ trợ CI/CD tự động và đảm bảo rằng shared domain là “nguồn sự thật duy nhất” cho toàn bộ logic nghiệp vụ.

---

Gợi ý triển khai cho team:

1. Trong môi trường dev monorepo, sử dụng workspace (pnpm/workspace, yarn workspaces, hoặc npm workspaces) để resolve `@medicare/shared` tới source hoặc built package.
2. Thiết lập một bước build CI/CD cho `@medicare/shared` trước khi build hoặc deploy các server.
3. Không commit hoặc merge các thay đổi sử dụng đường dẫn tương đối vào `main` branch. Kiểm tra bằng code review hoặc lint rule nếu cần.

File này là quy tắc bắt buộc — mọi dev và automated code generator phải tuân thủ.
