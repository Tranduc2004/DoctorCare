# Hướng dẫn sử dụng tính năng thay thế bác sĩ

## Tổng quan
Tính năng thay thế bác sĩ cho phép admin thay thế bác sĩ trong các ca làm việc khi cần thiết.

## Cách sử dụng

### 1. Truy cập modal thay thế bác sĩ
- Vào trang "Lịch làm việc bác sĩ"
- Nhấn nút "Ca cần xử lý" (màu cam)
- Chọn ca cần thay thế và nhấn "Thay thế"

### 2. Chọn bác sĩ mới
- Chọn bác sĩ mới từ dropdown
- Bác sĩ hiện tại sẽ không xuất hiện trong danh sách

### 3. Xử lý xung đột lịch

#### Trường hợp 1: Không có xung đột
- Hệ thống sẽ thay thế bác sĩ thành công
- Ca làm việc chuyển về trạng thái "pending"

#### Trường hợp 2: Có xung đột lịch
- **Không tick "Force Replace"**: Hệ thống từ chối và hiển thị lỗi
- **Tick "Force Replace"**: Hệ thống bỏ qua kiểm tra và thay thế

### 4. Thêm ghi chú (tùy chọn)
- Ghi chú sẽ được lưu vào trường `adminNote`
- Nếu không ghi chú, hệ thống sẽ tự động tạo ghi chú mặc định

## Các trạng thái lỗi

### Lỗi 400 - Bad Request
- **Thiếu ID bác sĩ mới**: Kiểm tra lại việc chọn bác sĩ
- **ID không hợp lệ**: Kiểm tra format ObjectId
- **Xung đột lịch**: Sử dụng Force Replace hoặc chọn bác sĩ khác
- **Thay thế bằng chính bác sĩ hiện tại**: Không thể thay thế bằng chính mình
- **Ca đã được đặt**: Không thể thay thế bác sĩ cho ca đã có bệnh nhân đặt

### Lỗi 404 - Not Found
- **Không tìm thấy ca làm việc**: Kiểm tra ID ca
- **Không tìm thấy bác sĩ mới**: Kiểm tra ID bác sĩ

## Lưu ý quan trọng

### Khi sử dụng Force Replace
- ⚠️ **Cảnh báo**: Có thể tạo ra xung đột lịch làm việc
- Bác sĩ mới có thể có 2 ca làm việc cùng lúc
- Chỉ sử dụng khi thực sự cần thiết

### Kiểm tra trước khi thay thế
- Xem xét lịch làm việc của bác sĩ mới
- Đảm bảo bác sĩ mới có thể làm việc vào thời gian đó
- Kiểm tra xem ca có bị đặt trước không

## Ví dụ sử dụng

### Thay thế bình thường
```json
{
  "newDoctorId": "68b08d7151625640b82049c2",
  "adminNote": "Bác sĩ cũ bị ốm",
  "forceReplace": false
}
```

### Thay thế với Force Replace
```json
{
  "newDoctorId": "68b08d7151625640b82049c2",
  "adminNote": "Thay thế khẩn cấp - bỏ qua xung đột",
  "forceReplace": true
}
```

## Troubleshooting

### Lỗi "Bác sĩ mới đã có lịch làm việc"
**Nguyên nhân**: Bác sĩ mới đã có ca làm việc được chấp nhận vào thời gian này
**Giải pháp**: 
1. Tick chọn "Force Replace"
2. Hoặc chọn bác sĩ khác
3. Hoặc chọn thời gian khác

### Lỗi "Không thể thay thế bác sĩ cho lịch đã được đặt"
**Nguyên nhân**: Ca làm việc đã có bệnh nhân đặt
**Giải pháp**: Không thể thay thế, cần liên hệ bệnh nhân để hủy đặt lịch trước

### Lỗi "ID không hợp lệ"
**Nguyên nhân**: Format ObjectId không đúng
**Giải pháp**: Kiểm tra lại ID trong database
