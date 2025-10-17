import axios from "../config/axios";

export interface Payment {
  _id: string;
  patientId: {
    _id: string;
    name: string; // Tên của bệnh nhân
    fullName?: string;
    phone: string;
    email: string;
  };
  appointmentId?: string;
  prescriptionId?: string;
  amount: number;
  status: "pending" | "captured" | "failed" | "refunded" | "authorized";
  paymentMethod: "payos" | "vnpay";
  description: string;
  transactionId?: string;
  refundReason?: string;
  paymentDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
    transactionRef?: string;
    paymentProof?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaymentResponse {
  payments: Payment[];
  pagination: {
    current: number;
    total: number;
    count: number;
  };
}

export interface PaymentStatistics {
  overview: {
    totalAmount: number;
    totalCount: number;
    completedAmount: number;
    refundedAmount: number;
  };
  byMethod: Array<{
    _id: string;
    count: number;
    amount: number;
  }>;
  byStatus: Array<{
    _id: string;
    count: number;
    amount: number;
  }>;
  daily: Array<{
    _id: string;
    count: number;
    amount: number;
  }>;
}

interface PaymentFilters {
  page?: number;
  limit?: number;
  status?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

// Get all payments with filters
export const getPayments = async (
  filters: PaymentFilters = {}
): Promise<PaymentResponse> => {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) queryParams.append(key, value.toString());
  });

  const response = await axios.get(`/admin/payments?${queryParams.toString()}`);
  return response.data;
};

// Get payment by ID
export const getPaymentById = async (id: string): Promise<Payment> => {
  const response = await axios.get(`/admin/payments/${id}`);
  return response.data;
};

// Process refund
export const refundPayment = async (
  id: string,
  reason: string
): Promise<Payment> => {
  const response = await axios.post(`/admin/payments/${id}/refund`, {
    reason,
  });
  return response.data.payment;
};

// Update payment status
export const updatePaymentStatus = async (
  id: string,
  status: string,
  reason?: string
): Promise<Payment> => {
  const response = await axios.put(`/admin/payments/${id}/status`, {
    status,
    reason,
  });
  return response.data.payment;
};

// Get payment statistics
export const getPaymentStatistics = async (
  startDate?: string,
  endDate?: string
): Promise<PaymentStatistics> => {
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append("startDate", startDate);
  if (endDate) queryParams.append("endDate", endDate);

  const response = await axios.get(
    `/admin/payments/statistics/overview?${queryParams.toString()}`
  );
  return response.data;
};

// Export payments data
export const exportPayments = async (
  format: "csv" | "excel" = "csv",
  startDate?: string,
  endDate?: string
): Promise<Blob> => {
  const queryParams = new URLSearchParams({
    format,
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  });

  const response = await axios.get(
    `/admin/payments/export?${queryParams.toString()}`,
    {
      responseType: "blob",
    }
  );

  return response.data;
};
