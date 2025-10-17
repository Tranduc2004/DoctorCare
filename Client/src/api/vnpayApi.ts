import api from "./axiosConfig";

export interface VNPayPaymentRequest {
  appointmentId: string;
  invoiceId: string;
}

export interface VNPayPaymentResponse {
  message: string;
  paymentUrl: string;
  txnRef: string;
  amount: number;
}

export interface VNPayStatusResponse {
  invoice: {
    _id: string;
    appointmentId: string;
    patientAmount: number;
    status: string;
    vnpayTxnRef?: string;
    vnpayTransactionNo?: string;
  };
  payment: {
    _id: string;
    amount: number;
    status: string;
    paymentMethod: string;
    transactionId?: string;
    vnpayTxnRef?: string;
    vnpayResponseCode?: string;
  } | null;
  appointment: {
    _id: string;
    appointmentDate: string;
    appointmentTime: string;
    status: string;
    paymentStatus?: string;
  };
  status: string;
}

export const vnpayApi = {
  // Create VNPay payment URL
  createPayment: async (
    data: VNPayPaymentRequest
  ): Promise<VNPayPaymentResponse> => {
    const response = await api.post("/patient/payments/vnpay/create", data);
    return response.data;
  },

  // Get VNPay payment status by transaction reference
  getPaymentStatus: async (txnRef: string): Promise<VNPayStatusResponse> => {
    const response = await api.get(`/patient/payments/vnpay/status/${txnRef}`);
    return response.data;
  },

  // Redirect to VNPay payment URL
  redirectToPayment: (paymentUrl: string): void => {
    window.location.href = paymentUrl;
  },

  // Parse return URL parameters (called on payment success/failure page)
  parseReturnUrl: (): Record<string, string> => {
    const urlParams = new URLSearchParams(window.location.search);
    const params: Record<string, string> = {};

    for (const [key, value] of urlParams.entries()) {
      params[key] = value;
    }

    return params;
  },

  // Helper to check if payment was successful from URL params
  isPaymentSuccessful: (): boolean => {
    const params = vnpayApi.parseReturnUrl();
    return (
      params.vnp_ResponseCode === "00" && params.vnp_TransactionStatus === "00"
    );
  },

  // Get error message from response code
  getErrorMessage: (responseCode: string): string => {
    const errorMessages: Record<string, string> = {
      "00": "Giao dịch thành công",
      "07": "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).",
      "09": "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.",
      "10": "Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần",
      "11": "Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.",
      "12": "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.",
      "13": "Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.",
      "24": "Giao dịch không thành công do: Khách hàng hủy giao dịch",
      "51": "Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.",
      "65": "Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.",
      "75": "Ngân hàng thanh toán đang bảo trì.",
      "79": "Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch",
      "99": "Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)",
    };

    return errorMessages[responseCode] || "Lỗi không xác định";
  },

  // Format amount for display
  formatAmount: (amount: number): string => {
    if (typeof amount !== "number" || isNaN(amount)) {
      console.warn("formatAmount: Invalid amount provided:", amount);
      return "0 VND";
    }

    const formatted = new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

    return formatted;
  },
};
