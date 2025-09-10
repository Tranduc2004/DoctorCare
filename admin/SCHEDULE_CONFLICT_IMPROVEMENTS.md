# Cải thiện xử lý xung đột lịch làm việc

## Tổng quan

Đã cải thiện logic xử lý xung đột lịch làm việc giữa các bác sĩ để admin có thể dễ dàng nhận biết và xử lý các trường hợp xung đột.

## Các cải thiện đã thực hiện

### 1. **Hiển thị xung đột trong Calendar View**

- **Màu đỏ (red)** cho các slot có ca của bác sĩ khác
- **Không cho phép chọn** các slot có xung đột để tránh tạo ca xung đột
- **Tooltip hiển thị tên bác sĩ cụ thể** đã có ca
- **Legend cập nhật** để hiển thị màu xung đột

### 2. **Kiểm tra xung đột khi tạo ca**

- **Từ chối tạo ca** nếu có xung đột với bác sĩ khác
- **Thông báo lỗi rõ ràng** về các slot xung đột
- **Hướng dẫn** chọn slot khác hoặc bác sĩ khác

### 3. **Cải thiện thông báo lỗi khi thay thế bác sĩ**

- **Phân loại lỗi rõ ràng** (xung đột lịch, hạn chế, v.v.)
- **Hướng dẫn cụ thể** về cách sử dụng Force Replace
- **Thông tin chi tiết** về xung đột nếu có

### 4. **Giao diện cải thiện**

- **Cột trạng thái mới** hiển thị cả trạng thái ca và trạng thái đặt lịch
- **Nút xóa thông minh** - disable khi ca đã được đặt
- **Hướng dẫn chi tiết** trong modal thay thế bác sĩ

## Cách hoạt động

### Calendar View

```
🟢 Xanh: Slot trống, có thể tạo ca
🔴 Đỏ: Slot đã có ca làm việc hoặc ca của bác sĩ khác, không thể tạo
🔵 Xanh dương: Slot đang được chọn
⚫ Xám: Slot đã qua thời gian
```

### Kiểm tra xung đột

1. **Khi chọn bác sĩ**: Hệ thống kiểm tra xung đột với tất cả bác sĩ khác
2. **Khi tạo ca**: Cảnh báo nếu có xung đột và hỏi ý kiến người dùng
3. **Khi thay thế bác sĩ**: Kiểm tra xung đột và cho phép Force Replace

### Xử lý xung đột

- **Không có Force Replace**: Từ chối thay thế nếu có xung đột
- **Có Force Replace**: Bỏ qua kiểm tra và thay thế (có thể tạo xung đột)

## Lợi ích

### Cho Admin

- **Nhận biết ngay** các slot có xung đột
- **Quyết định sáng suốt** khi tạo ca hoặc thay thế bác sĩ
- **Thông tin đầy đủ** về các trường hợp xung đột

### Cho Hệ thống

- **Giảm thiểu** xung đột lịch làm việc
- **Kiểm soát tốt hơn** việc tạo và thay thế ca
- **Ghi log chi tiết** về các thao tác admin

## Sử dụng

### Tạo ca có xung đột

1. Chọn bác sĩ
2. Chọn các slot (slot đỏ = có ca của bác sĩ khác, không thể chọn)
3. Nhấn "Tạo ca"
4. Hệ thống từ chối và hiển thị lỗi xung đột
5. Chọn slot khác hoặc bác sĩ khác

### Thay thế bác sĩ có xung đột

1. Vào "Ca cần xử lý"
2. Chọn ca cần thay thế
3. Chọn bác sĩ mới
4. Nếu có xung đột:
   - Tick "Force Replace" để bỏ qua
   - Hoặc chọn bác sĩ khác
5. Nhấn "Thay thế"

## Lưu ý quan trọng

### Khi sử dụng Force Replace

- ⚠️ **Cảnh báo**: Có thể tạo ra xung đột lịch làm việc
- Bác sĩ mới có thể có 2 ca làm việc cùng lúc
- Chỉ sử dụng khi thực sự cần thiết

### Khi tạo ca có xung đột

- Hệ thống sẽ từ chối tạo ca
- Admin phải chọn slot khác hoặc bác sĩ khác
- Xung đột được ngăn chặn hoàn toàn
- Thông báo lỗi hiển thị tên bác sĩ cụ thể đã có ca

## Kết luận

Các cải thiện này giúp admin quản lý lịch làm việc hiệu quả hơn, giảm thiểu xung đột và có thông tin đầy đủ để đưa ra quyết định phù hợp.
