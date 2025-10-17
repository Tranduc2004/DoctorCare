import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { paymentApi } from "../../../api/paymentApi";

const PaymentFailure: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [errorDetails, setErrorDetails] = useState<{
    errorCode?: string;
    errorMessage?: string;
    appointmentId?: string;
  }>({});

  const appointmentId = searchParams.get("appointmentId");
  const errorCode =
    searchParams.get("error") || searchParams.get("vnp_ResponseCode");

  useEffect(() => {
    // Parse VNPay return parameters if available
    const params = paymentApi.vnpay.parseReturnUrl();

    setErrorDetails({
      errorCode: errorCode || params.vnp_ResponseCode || "unknown",
      errorMessage: errorCode
        ? paymentApi.vnpay.getErrorMessage(errorCode)
        : "Lỗi không xác định",
      appointmentId: appointmentId || params.appointmentId,
    });
  }, [errorCode, appointmentId]);

  const handleRetryPayment = () => {
    if (errorDetails.appointmentId) {
      navigate(`/payment/${errorDetails.appointmentId}`);
    }
  };

  const handleBackToAppointments = () => {
    navigate("/appointments");
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleContactSupport = () => {
    window.open("tel:19002115", "_self");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        {/* Error Icon */}
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Thanh toán không thành công
          </h2>
          <p className="text-gray-600">
            Giao dịch của bạn đã bị hủy hoặc có lỗi xảy ra
          </p>
        </div>

        {/* Error Details */}
        <div className="bg-red-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-red-900 mb-2">Chi tiết lỗi</h3>
          <div className="space-y-2 text-sm">
            {errorDetails.errorCode && (
              <div className="flex justify-between">
                <span className="text-red-700">Mã lỗi:</span>
                <span className="font-medium text-red-800">
                  {errorDetails.errorCode}
                </span>
              </div>
            )}
            {errorDetails.errorMessage && (
              <div>
                <span className="text-red-700">Mô tả:</span>
                <p className="text-red-800 mt-1">{errorDetails.errorMessage}</p>
              </div>
            )}
            {errorDetails.appointmentId && (
              <div className="flex justify-between">
                <span className="text-red-700">Mã lịch khám:</span>
                <span className="font-medium text-red-800">
                  {errorDetails.appointmentId.slice(-8).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Common Reasons */}
        <div className="bg-yellow-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-900 mb-2">
            Các nguyên nhân thường gặp
          </h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Hủy giao dịch trong quá trình thanh toán</li>
            <li>• Số dư tài khoản không đủ</li>
            <li>• Nhập sai thông tin thẻ/OTP</li>
            <li>• Thẻ/tài khoản bị khóa</li>
            <li>• Hết thời gian thanh toán</li>
            <li>• Lỗi kết nối mạng</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {errorDetails.appointmentId && (
            <button
              onClick={handleRetryPayment}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
            >
              Thử lại thanh toán
            </button>
          )}

          <button
            onClick={handleBackToAppointments}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors duration-200"
          >
            Xem lịch khám
          </button>

          <button
            onClick={handleContactSupport}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200"
          >
            Liên hệ hỗ trợ
          </button>

          <button
            onClick={handleBackToHome}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors duration-200"
          >
            Về trang chủ
          </button>
        </div>

        {/* Help Information */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-blue-50 rounded-lg p-3">
            <h4 className="font-semibold text-blue-900 mb-1">Cần hỗ trợ?</h4>
            <p className="text-sm text-blue-800 mb-2">
              Đội ngũ hỗ trợ của chúng tôi sẵn sàng giúp bạn 24/7
            </p>
            <div className="flex items-center space-x-4 text-sm">
              <a
                href="tel:19002115"
                className="flex items-center space-x-1 text-blue-600 font-medium"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span>19002115</span>
              </a>
              <a
                href="mailto:support@medicare.vn"
                className="flex items-center space-x-1 text-blue-600 font-medium"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
                <span>Email</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;
