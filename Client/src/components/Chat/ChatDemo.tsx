import React, { useState } from "react";
import { MessageSquare, Send, User, Calendar, Clock } from "lucide-react";
import ChatModal from "./ChatModal";

// Mock appointment data for demo
const mockAppointment = {
  _id: "appointment-123",
  patientId: {
    _id: "patient-456",
    name: "Nguyễn Văn A",
    email: "nguyenvana@email.com",
    phone: "0909123456",
  },
  scheduleId: {
    _id: "schedule-789",
    date: "2024-01-15",
    startTime: "09:00",
    endTime: "09:30",
  },
  status: "confirmed",
  symptoms: "Đau đầu, sốt nhẹ",
  note: "[Dịch vụ] Khám tổng quát 30 phút | Triệu chứng: Đau đầu, sốt nhẹ",
  createdAt: "2024-01-10T10:00:00Z",
};

const ChatDemo: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSendMessage = (message: string, appointmentId: string) => {
    console.log("Demo: Sending message:", message);
    console.log("Demo: To appointment:", appointmentId);
    alert("Demo: Tin nhắn đã được gửi thành công!");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-3xl font-bold text-slate-900">
            Demo Hệ thống Chat Bác sĩ
          </h1>
          <p className="text-slate-600">
            Demo các template chat tự động theo playbook
          </p>
        </div>

        {/* Mock Appointment Card */}
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {mockAppointment.patientId.name}
              </h3>
              <p className="text-sm text-slate-600">
                {mockAppointment.patientId.email} •{" "}
                {mockAppointment.patientId.phone}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Calendar className="h-4 w-4" />
              {new Date(
                mockAppointment.scheduleId.date + "T00:00:00"
              ).toLocaleDateString("vi-VN")}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Clock className="h-4 w-4" />
              {mockAppointment.scheduleId.startTime} -{" "}
              {mockAppointment.scheduleId.endTime}
            </div>
          </div>

          {mockAppointment.symptoms && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-medium text-amber-800">Triệu chứng:</p>
              <p className="text-sm text-amber-700">
                {mockAppointment.symptoms}
              </p>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
              Đã xác nhận
            </span>
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <MessageSquare className="h-4 w-4" />
              Mở Chat Demo
            </button>
          </div>
        </div>

        {/* Features List */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-3 text-lg font-semibold text-slate-900">
              Template Chat
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>• Xác nhận lịch hẹn</li>
              <li>• Nhắc nhở T-24h/T-2h</li>
              <li>• Đề xuất đổi lịch</li>
              <li>• Thu thập thông tin trước khám</li>
              <li>• Tóm tắt đơn thuốc</li>
              <li>• Xử lý tình huống đặc biệt</li>
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-3 text-lg font-semibold text-slate-900">
              Tính năng
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>• Biến động tự động điền</li>
              <li>• Quick replies có sẵn</li>
              <li>• Checklist chuẩn bị theo dịch vụ</li>
              <li>• Copy tin nhắn</li>
              <li>• Giao diện responsive</li>
              <li>• Tích hợp dễ dàng</li>
            </ul>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-6">
          <h3 className="mb-3 text-lg font-semibold text-blue-900">
            Hướng dẫn sử dụng Demo
          </h3>
          <ol className="space-y-2 text-sm text-blue-800">
            <li>1. Nhấn "Mở Chat Demo" để mở modal chat</li>
            <li>2. Chọn template từ danh mục bên trái</li>
            <li>3. Chỉnh sửa các biến trong tab "Chỉnh sửa biến"</li>
            <li>4. Xem trước tin nhắn trong tab "Xem trước"</li>
            <li>5. Copy tin nhắn hoặc gửi demo</li>
          </ol>
        </div>
      </div>

      {/* Chat Modal */}
      <ChatModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        appointment={mockAppointment}
        doctorName="BS. Nguyễn Thị B"
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default ChatDemo;
