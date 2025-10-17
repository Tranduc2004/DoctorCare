import React, { useState } from "react";
import { paymentApi } from "../../../api/paymentApi";

interface VNPayPaymentProps {
  appointmentId: string;
  invoice: {
    _id: string;
    patientAmount: number;
    subtotal: number;
    insuranceCoverage: number;
    dueDate?: string;
  };
  onPaymentInitiated?: (paymentUrl: string, txnRef: string) => void;
  onError?: (error: string) => void;
}

const VNPayPayment: React.FC<VNPayPaymentProps> = ({
  appointmentId,
  invoice,
  onPaymentInitiated,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setIsLoading(true);

      const response = await paymentApi.vnpay.createPayment({
        appointmentId,
        invoiceId: invoice._id,
      });

      // Call callback if provided
      if (onPaymentInitiated) {
        onPaymentInitiated(response.paymentUrl, response.txnRef);
      }

      // Redirect to VNPay
      paymentApi.vnpay.redirectToPayment(response.paymentUrl);
    } catch (error) {
      console.error("Error creating VNPay payment:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi tạo thanh toán";

      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      {/* VNPay Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Thanh toán VNPay
            </h3>
            <p className="text-sm text-gray-600">
              Thanh toán trực tuyến an toàn
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <img
            src="https://vnpay.vn/s1/statics.vnpay.vn/2023/9/06ncktiwd6dc1694418196384.png"
            alt="VNPay"
            className="h-8"
          />
        </div>
      </div>

      {/* Debug Information - Temporary */}

      {/* Payment Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Chi tiết thanh toán</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Tổng chi phí:</span>
            <span className="font-medium">
              {paymentApi.vnpay.formatAmount(invoice.subtotal || 0)}
            </span>
          </div>
          {(invoice.insuranceCoverage || 0) > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Bảo hiểm chi trả:</span>
              <span className="text-green-600">
                -{paymentApi.vnpay.formatAmount(invoice.insuranceCoverage || 0)}
              </span>
            </div>
          )}
          <hr className="border-gray-200" />
          <div className="flex justify-between text-base font-semibold">
            <span className="text-gray-900">Số tiền thanh toán:</span>
            <span className="text-blue-600">
              {paymentApi.vnpay.formatAmount(invoice.patientAmount || 0)}
            </span>
          </div>
          {/* Additional test - raw display */}
          <div className="flex justify-between text-sm text-gray-500">
            <span>Raw amount (test):</span>
            <span>{(invoice.patientAmount || 0).toLocaleString()}đ</span>
          </div>
        </div>
      </div>

      {/* Payment Features */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">
          Phương thức thanh toán
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <svg
              className="w-4 h-4 text-green-500"
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
            <span>ATM/Internet Banking</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <svg
              className="w-4 h-4 text-green-500"
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
            <span>Visa/MasterCard</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <svg
              className="w-4 h-4 text-green-500"
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
            <span>QR Code</span>
          </div>
        </div>
      </div>

      {/* Due Date Warning */}
      {invoice.dueDate && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
          <div className="flex items-start space-x-2">
            <svg
              className="w-5 h-5 text-yellow-500 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <div>
              <p className="text-yellow-800 text-sm font-medium">
                Thời hạn thanh toán
              </p>
              <p className="text-yellow-700 text-sm">
                Vui lòng thanh toán trước{" "}
                {new Date(invoice.dueDate).toLocaleString("vi-VN")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={isLoading}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
          isLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 shadow-lg hover:shadow-xl"
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Đang xử lý...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span>Thanh toán với VNPay</span>
          </div>
        )}
      </button>

      {/* Security Note */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          🔒 Giao dịch được bảo mật bằng công nghệ mã hóa SSL 256-bit
        </p>
      </div>
    </div>
  );
};

export default VNPayPayment;
