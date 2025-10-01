// Admin types - tương tự với Server
export interface Admin {
  _id: string;
  username: string;
  email: string;
  role: "admin";
  createdAt: string;
  updatedAt: string;
}

export interface Insurance {
  _id: string;
  patientId: string;
  provider?: string; // Cơ quan BHYT
  policyNumber?: string; // Số thẻ BHYT
  validFrom?: string; // YYYY-MM-DD
  validTo?: string; // YYYY-MM-DD
  regionCode?: string; // Mã KCB ban đầu
  imageUrl?: string; // ảnh thẻ BHYT
  coverageRate?: number; // % mức hưởng
  managementCode?: string; // Mã đơn vị quản lý
  participantType?: string; // Đối tượng tham gia
  householdRole?: string; // Quan hệ chủ hộ
  notes?: string; // Ghi chú
  verificationStatus: "pending" | "verified" | "rejected" | "expired";
  verifiedAt?: Date;
  verifiedBy?: string;
  verificationNotes?: string;
  rejectionReason?: string;
  submittedAt: Date;
  submittedBy?: string;
  lastEditedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  role: "patient";
  insurance?: Insurance;
  createdAt: string;
  updatedAt: string;
}
