COMPILOT LUÔN PHẢN HỒI BẰNG TIẾNG VIỆT
2.2. Luồng Đặt Lịch và Thanh Toán (Phía Bệnh Nhân)
Đây là luồng quan trọng nhất, đảm bảo không có lịch hẹn "ảo" và tối ưu hóa thời gian của bác sĩ.

Bệnh nhân Tìm và Chọn Lịch:

Bệnh nhân chọn hình thức khám: OFFLINE (Tại phòng khám) hoặc ONLINE (Trực tuyến).

Bệnh nhân tìm kiếm theo chuyên khoa, bác sĩ hoặc dịch vụ.

Hệ thống hiển thị các khung giờ có trạng thái AVAILABLE của các bác sĩ phù hợp.

Tạo Đơn Hẹn và Tạm Giữ:

Khi bệnh nhân chọn một khung giờ, hệ thống sẽ tạo một lịch hẹn tạm thời với trạng thái PENDING_PAYMENT (Chờ thanh toán).

Khung giờ này sẽ được tạm giữ trong 15 phút và không hiển thị cho người khác.

Hệ thống tính toán và hiển thị tổng chi phí cuối cùng, sau khi đã áp dụng BHYT và các phụ phí (nếu có).

Thanh Toán:

Bệnh nhân phải hoàn tất thanh toán trong 15 phút.

Thanh toán thành công:

Trạng thái lịch hẹn chuyển thành CONFIRMED (Đã xác nhận).

Hệ thống gửi thông báo xác nhận cho cả bệnh nhân và bác sĩ.

Tính năng chat giữa bác sĩ và bệnh nhân được kích hoạt.

Thanh toán thất bại / Hết thời gian:

Lịch hẹn tạm thời bị hủy.

Khung giờ được "mở" lại với trạng thái AVAILABLE cho người khác đặt.

2.3. Luồng Khám Bệnh và Hoàn Tất
Bắt đầu Khám:

Khi đến thời gian hẹn, lịch CONFIRMED sẽ tự động chuyển trạng thái sang IN_PROGRESS (Đang khám).

Thực hiện Khám:

Offline: Bệnh nhân đến phòng khám.

Online: Bệnh nhân và bác sĩ kết nối qua link video call/chat trên hệ thống.

Kết thúc Khám:

Bác sĩ ghi lại chẩn đoán, ghi chú và tạo đơn thuốc điện tử.

Bác sĩ chuyển trạng thái lịch hẹn sang COMPLETED (Hoàn thành).

Toàn bộ thông tin được lưu trữ vào Lịch sử khám bệnh của bệnh nhân.

3. Chính Sách Xử Lý Tình Huống Đặc Biệt
   3.1. Bệnh Nhân Hủy/Đổi Lịch
   Trước 24 giờ so với giờ hẹn: Cho phép bệnh nhân tự đổi sang một lịch AVAILABLE khác hoặc hủy lịch và nhận lại tiền (dưới dạng tín dụng hoặc hoàn tiền trực tiếp, có thể trừ phí giao dịch).

Trong vòng 24 giờ so với giờ hẹn: Không cho phép hủy/đổi, hoặc áp dụng một khoản phí nếu muốn đổi lịch.

3.2. Bác Sĩ Có Việc Đột Xuất
Thông báo Khẩn: Bác sĩ/Admin phải cập nhật trên hệ thống. Hệ thống ngay lập tức gửi thông báo (SMS/Email/Push Notification) đến bệnh nhân bị ảnh hưởng.

Đề xuất Giải pháp: Admin liên hệ và cung cấp cho bệnh nhân các lựa chọn:

Đổi sang một bác sĩ khác cùng chuyên khoa có lịch trống gần nhất (có thể kèm ưu đãi).

Dời sang một lịch khác với cùng bác sĩ đó.

Hủy lịch và được hoàn tiền 100%. 4. Các Thành Phần Quan Trọng Khác
Hồ Sơ Bệnh Án:

Tiền sử bệnh (Medical History): Bệnh nhân cần điền trước khi khám lần đầu.

Lịch sử khám bệnh (Consultation History): Tự động cập nhật sau mỗi lần khám.

Hệ thống Thông báo (Notifications):

Nhắc lịch hẹn (trước 1 ngày, 2 giờ).

Xác nhận thanh toán, đặt lịch.

Thông báo về các thay đổi đột xuất.

Module Thanh Toán: Tích hợp với các cổng thanh toán (VNPAY, Momo, thẻ ngân hàng...).

Module Chat/Video Call: Xây dựng hoặc tích hợp dịch vụ bên thứ ba để phục vụ khám online.
