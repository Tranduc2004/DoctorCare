export enum AppointmentStatus {
  // Initial states
  BOOKED = "booked", // Patient booked, waiting for doctor approval

  // Doctor decision states
  DOCTOR_APPROVED = "doctor_approved", // Doctor accepted appointment
  DOCTOR_RESCHEDULE = "doctor_reschedule", // Doctor wants to reschedule
  DOCTOR_REJECTED = "doctor_rejected", // Doctor rejected appointment

  // Payment states
  AWAIT_PAYMENT = "await_payment", // Waiting for patient payment
  PAID = "paid", // Payment completed
  PAYMENT_OVERDUE = "payment_overdue", // Payment deadline passed

  // Consultation states
  CONFIRMED = "confirmed", // Payment done, appointment confirmed
  IN_CONSULT = "in_consult", // Currently in consultation
  PRESCRIPTION_ISSUED = "prescription_issued", // Doctor issued prescription
  READY_TO_DISCHARGE = "ready_to_discharge", // Ready for final payment

  // Final states
  COMPLETED = "completed", // All done
  CANCELLED = "cancelled", // Cancelled by patient/doctor
  CLOSED = "closed", // Closed after rejection/refund
}

export enum PaymentStatus {
  PENDING = "pending",
  AUTHORIZED = "authorized", // Money held but not captured
  CAPTURED = "captured", // Money actually taken
  REFUNDED = "refunded",
  FAILED = "failed",
}

export enum PaymentType {
  CONSULTATION_FEE = "consultation_fee", // Basic consultation fee
  DEPOSIT = "deposit", // Deposit to hold appointment
  ADDITIONAL_SERVICES = "additional_services", // Lab tests, imaging, etc.
  MEDICATION = "medication", // Prescription drugs
  FINAL_SETTLEMENT = "final_settlement", // Final payment after consultation
}

export enum InsuranceCoverage {
  FULL_COVERAGE = "full_coverage", // 100% covered by insurance
  PARTIAL_COVERAGE = "partial_coverage", // Partial coverage, patient pays co-pay
  NO_COVERAGE = "no_coverage", // Not covered, patient pays full
}

export interface PaymentItem {
  type: PaymentType;
  description: string;
  amount: number;
  insuranceCoverage?: InsuranceCoverage;
  insuranceAmount?: number; // Amount covered by insurance
  patientAmount: number; // Amount patient needs to pay
}

export interface Invoice {
  _id: string;
  appointmentId: string;
  invoiceNumber: string;
  type: "consultation" | "final_settlement";
  items: PaymentItem[];
  subtotal: number;
  insuranceCoverage: number;
  patientAmount: number;
  status: PaymentStatus;
  createdAt: Date;
  dueDate?: Date;
  paidAt?: Date;
}

export interface Payment {
  _id: string;
  appointmentId: string;
  invoiceId: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod: string;
  transactionId?: string;
  authorizedAt?: Date;
  capturedAt?: Date;
  refundedAt?: Date;
  refundAmount?: number;
  createdAt: Date;
}
