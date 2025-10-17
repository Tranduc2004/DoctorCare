import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { paymentApi } from "../../../api/paymentApi";

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<{
    appointment?: {
      appointmentDate: string;
      appointmentTime: string;
    };
    invoices?: Array<{
      patientAmount: number;
    }>;
  } | null>(null);

  const appointmentId = searchParams.get("appointmentId");
  const paymentId = searchParams.get("paymentId");

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      if (!appointmentId) {
        setLoading(false);
        return;
      }

      try {
        const details = await paymentApi.getDetails(appointmentId);
        setPaymentDetails(details);
      } catch (error) {
        console.error("Error fetching payment details:", error);
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to ensure the payment has been processed on the backend
    const timer = setTimeout(fetchPaymentDetails, 2000);
    return () => clearTimeout(timer);
  }, [appointmentId]);

  const handleViewAppointment = () => {
    navigate(`/appointments/${appointmentId}`);
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Đang xác nhận thanh toán...
            </h2>
            <p className="text-gray-600">Vui lòng chờ trong giây lát</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        {/* Success Icon */}
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Thanh toán thành công!
          </h2>
          <p className="text-gray-600">Lịch khám của bạn đã được xác nhận</p>
        </div>

        {/* Payment Details */}
        {paymentDetails && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              Chi tiết thanh toán
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Mã lịch khám:</span>
                <span className="font-medium">
                  {appointmentId?.slice(-8).toUpperCase()}
                </span>
              </div>
              {paymentDetails.appointment && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày khám:</span>
                    <span className="font-medium">
                      {new Date(
                        paymentDetails.appointment.appointmentDate
                      ).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Giờ khám:</span>
                    <span className="font-medium">
                      {paymentDetails.appointment.appointmentTime}
                    </span>
                  </div>
                </>
              )}
              {paymentDetails.invoices?.[0] && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Số tiền đã thanh toán:</span>
                  <span className="font-semibold text-green-600">
                    {paymentApi.vnpay.formatAmount(
                      paymentDetails.invoices[0].patientAmount
                    )}
                  </span>
                </div>
              )}
              {paymentId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã giao dịch:</span>
                  <span className="font-medium">
                    {paymentId.slice(-8).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Bước tiếp theo</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Lịch khám đã được xác nhận</li>
            <li>✓ Bạn sẽ nhận được thông báo qua email</li>
            <li>✓ Vui lòng có mặt đúng giờ hẹn</li>
            <li>✓ Mang theo giấy tờ tùy thân và thẻ BHYT (nếu có)</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleViewAppointment}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
          >
            Xem chi tiết lịch khám
          </button>
          <button
            onClick={handleBackToHome}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors duration-200"
          >
            Về trang chủ
          </button>
        </div>

        {/* Support */}
        <div className="text-center mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Cần hỗ trợ? Liên hệ{" "}
            <a href="tel:19002115" className="text-blue-600 font-medium">
              19002115
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
