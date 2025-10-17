import { Request, Response } from "express";
import mongoose from "mongoose";
import Appointment from "../models/Appointment";
import Invoice from "../models/Invoice";
import Payment from "../../../shared/models/Payment";
import DoctorSchedule from "../../doctor/models/DoctorSchedule";
import { computeConsultPrice } from "../../pricing/services/computePricing";
import {
  AppointmentStatus,
  PaymentStatus,
  PaymentType,
  InsuranceCoverage,
} from "../../../shared/types/appointment";
import { PAYMENT_HOLD_MS } from "../../../shared/constants/payment";
import { vnpayService } from "../../../shared/services/vnpayService";
import BankAccount from "../../shared/models/BankAccount";
// Note: static VietQR generation removed to enforce PayOS-first flow

// PayOS helpers
const makeNumericOrderCode = () => Date.now();
const truncateDesc = (s?: string, max = 25) => {
  if (!s) return undefined;
  return s.length > max ? s.slice(0, max) : s;
};

// Helper: load the PayOS SDK more defensively and return possible export keys.
const loadPayOS = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PayOSLib = require("@payos/node");
    const exportKeys =
      PayOSLib && typeof PayOSLib === "object" ? Object.keys(PayOSLib) : [];
    let PayOS = PayOSLib && (PayOSLib.default || PayOSLib);

    // If not a constructor, try to find a function export on the module
    if (
      typeof PayOS !== "function" &&
      PayOSLib &&
      typeof PayOSLib === "object"
    ) {
      for (const k of Object.keys(PayOSLib)) {
        if (typeof (PayOSLib as any)[k] === "function") {
          PayOS = (PayOSLib as any)[k];
          break;
        }
      }
    }

    return { PayOS, exportKeys };
  } catch (e) {
    return { PayOS: null, exportKeys: [] };
  }
};

interface ErrorWithMessage {
  message: string;
}

// Helper to safely resolve doctorId to a plain string id. Accepts:
// - a string ObjectId
// - a populated mongoose document with an _id field
// - an ObjectId instance
// Returns undefined when a usable id can't be derived.
const resolveDoctorId = (docField: any): string | undefined => {
  if (!docField) return undefined;
  if (typeof docField === "string") {
    const s = docField.trim();
    if (/^[0-9a-fA-F]{24}$/.test(s)) return s;
    return undefined;
  }
  // mongoose ObjectId or object with _id
  if (typeof docField === "object") {
    if ((docField as any)?._id) return String((docField as any)._id);
    // Some drivers may provide an ObjectId-like toString()
    try {
      const s = String(docField);
      if (/^[0-9a-fA-F]{24}$/.test(s)) return s;
    } catch {}
  }
  return undefined;
};

// Create consultation invoice when doctor approves
export const createConsultationInvoice = async (
  req: Request,
  res: Response
) => {
  try {
    const { appointmentId } = req.params;
    const { consultationFee, depositAmount, insuranceCoverage } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
    }

    // Resolve numeric inputs safely: use request body if provided otherwise fall back
    // to appointment stored values. Coerce to Number and guard against NaN.
    const feeInput = Number(
      // prefer explicit body value, then appointment value, then 0
      consultationFee ?? appointment.consultationFee ?? 0
    );
    const depositInput = Number(
      depositAmount ?? appointment.depositAmount ?? 0
    );
    const coverageInput = Number(
      // coverage as percentage (0-100)
      insuranceCoverage ?? appointment.insuranceCoverage ?? 0
    );

    if (
      Number.isNaN(feeInput) ||
      Number.isNaN(depositInput) ||
      Number.isNaN(coverageInput)
    ) {
      return res.status(400).json({ message: "Dữ liệu tiền không hợp lệ" });
    }

    // If a pending consultation invoice already exists, keep a reference.
    const existing = await Invoice.findOne({
      appointmentId,
      type: "consultation",
      status: PaymentStatus.PENDING,
    });

    // If existing invoice is present and already has non-zero subtotal, return it
    if (existing && existing.subtotal && existing.subtotal > 0) {
      return res.json({
        message: "Hóa đơn tạm ứng đã tồn tại",
        invoice: existing,
        appointment,
      });
    }

    // Calculate per-item insurance: typically deposit is not covered.
    const consultationInsurance = Math.round(
      (feeInput * (coverageInput || 0)) / 100
    );
    const consultationPatient = feeInput - consultationInsurance;
    const depositPatient = depositInput; // deposit not covered

    const items: any[] = [];
    if (feeInput > 0) {
      items.push({
        type: PaymentType.CONSULTATION_FEE,
        description: "Phí khám cơ bản",
        amount: feeInput,
        insuranceCoverage:
          coverageInput > 0
            ? InsuranceCoverage.PARTIAL_COVERAGE
            : InsuranceCoverage.NO_COVERAGE,
        insuranceAmount: consultationInsurance,
        patientAmount: consultationPatient,
      });
    }
    if (depositInput > 0) {
      items.push({
        type: PaymentType.DEPOSIT,
        description: "Đặt cọc giữ chỗ",
        amount: depositInput,
        insuranceCoverage: InsuranceCoverage.NO_COVERAGE,
        insuranceAmount: 0,
        patientAmount: depositPatient,
      });
    }

    const subtotal = feeInput + depositInput;
    const totalInsurance = consultationInsurance; // deposit not covered
    const totalPatient = consultationPatient + depositPatient;

    // If inputs are zero and we have an existing zero invoice, try to compute pricing
    if (feeInput <= 0 && depositInput <= 0 && existing) {
      try {
        const parseService = (note?: string) => {
          if (!note) return "";
          const m = note.match(/\[Dịch vụ\]\s*([^|\n]+)/);
          return m?.[1]?.trim() || "";
        };

        const serviceCode = parseService(appointment.note) || "";
        const durationMin = 45; // fallback
        const startAt = new Date(
          `${appointment.appointmentDate}T${appointment.appointmentTime}:00`
        ).toISOString();
        const bhytEligible = (appointment.insuranceCoverage || 0) > 0;
        const copayRate = (appointment.insuranceCoverage || 0) / 100;

        const computed = await computeConsultPrice({
          serviceCode,
          doctorId: resolveDoctorId(appointment.doctorId),
          durationMin,
          startAt,
          bhytEligible,
          copayRate,
        });

        const mappedItems = computed.items.map((it: any) => {
          const type =
            it.component === "facility"
              ? PaymentType.CONSULTATION_FEE
              : PaymentType.ADDITIONAL_SERVICES;
          return {
            type,
            description: it.description,
            amount: it.amount,
            insuranceCoverage:
              it.payer === "bhyt"
                ? InsuranceCoverage.PARTIAL_COVERAGE
                : InsuranceCoverage.NO_COVERAGE,
            insuranceAmount: it.insuranceAmount || 0,
            patientAmount: it.patientAmount || 0,
          };
        });

        existing.items = mappedItems;
        existing.subtotal = computed.totals.total;
        existing.insuranceCoverage = computed.totals.bhyt;
        existing.patientAmount = computed.totals.patient;
        existing.dueDate = new Date(Date.now() + PAYMENT_HOLD_MS);
        await existing.save();

        // Update appointment totals and set hold expiry to match invoice dueDate
        appointment.status = AppointmentStatus.AWAIT_PAYMENT;
        appointment.holdExpiresAt = existing.dueDate;
        appointment.consultationFee = appointment.consultationFee ?? 0;
        appointment.depositAmount = appointment.depositAmount ?? 0;
        appointment.totalAmount = computed.totals.total;
        appointment.insuranceCoverage = computed.totals.bhyt;
        appointment.patientAmount = computed.totals.patient;
        await appointment.save();

        return res.json({
          message: "Đã cập nhật hóa đơn tạm ứng",
          invoice: existing,
          appointment,
        });
      } catch (err) {
        console.error("Compute pricing failed:", err);
        // fallthrough: if compute fails, return existing invoice as-is
        return res.json({
          message: "Hóa đơn tạm ứng đã tồn tại",
          invoice: existing,
          appointment,
        });
      }
    }

    // If inputs are zero and no existing invoice, attempt to compute pricing
    if (feeInput <= 0 && depositInput <= 0 && !existing) {
      try {
        const parseService = (note?: string) => {
          if (!note) return "";
          const m = note.match(/\[Dịch vụ\]\s*([^|\n]+)/);
          return m?.[1]?.trim() || "";
        };

        const SERVICE_LABEL_MAP: Record<string, string> = {
          KHAM_CHUYEN_KHOA: "Khám chuyên khoa",
          KHAM_TONG_QUAT: "Khám tổng quát",
          GOI_DINH_KY: "Khám định kỳ",
          TU_VAN_DINH_DUONG: "Tư vấn dinh dưỡng",
          TU_VAN_TAM_LY: "Tư vấn tâm lý",
        };
        const rawSvcFromType = appointment.serviceType
          ? SERVICE_LABEL_MAP[String(appointment.serviceType)] ||
            String(appointment.serviceType)
          : "";
        const fromNote = parseService(appointment.note) || "";
        const normalizeServiceLabel = (s: string) => {
          if (!s) return "";
          const idx = s.indexOf("(");
          return (idx >= 0 ? s.slice(0, idx) : s).trim();
        };
        const serviceCode =
          normalizeServiceLabel(rawSvcFromType) ||
          normalizeServiceLabel(fromNote) ||
          "";
        const durationMin = 45; // default duration in minutes when unknown
        const startAt =
          appointment.appointmentDate && appointment.appointmentTime
            ? new Date(
                `${appointment.appointmentDate}T${appointment.appointmentTime}:00`
              ).toISOString()
            : new Date().toISOString();
        const bhytEligible = (appointment.insuranceCoverage || 0) > 0;
        const copayRate = (appointment.insuranceCoverage || 0) / 100;

        const computed = await computeConsultPrice({
          serviceCode,
          doctorId: resolveDoctorId(appointment.doctorId),
          durationMin,
          startAt,
          bhytEligible,
          copayRate,
        });

        const mappedItems = computed.items.map((it: any) => {
          const type =
            it.component === "facility"
              ? PaymentType.CONSULTATION_FEE
              : PaymentType.ADDITIONAL_SERVICES;
          return {
            type,
            description: it.description,
            amount: it.amount,
            insuranceCoverage:
              it.payer === "bhyt"
                ? InsuranceCoverage.PARTIAL_COVERAGE
                : InsuranceCoverage.NO_COVERAGE,
            insuranceAmount: it.insuranceAmount || 0,
            patientAmount: it.patientAmount || 0,
          };
        });

        const invoice = await Invoice.create({
          appointmentId,
          type: "consultation",
          items: mappedItems,
          subtotal: computed.totals.total,
          insuranceCoverage: computed.totals.bhyt,
          patientAmount: computed.totals.patient,
          dueDate: new Date(Date.now() + PAYMENT_HOLD_MS),
        });

        // set hold expiry on appointment to keep invoice/appointment in sync
        appointment.status = AppointmentStatus.AWAIT_PAYMENT;
        appointment.totalAmount = computed.totals.total;
        appointment.insuranceCoverage = computed.totals.bhyt;
        appointment.patientAmount = computed.totals.patient;
        appointment.holdExpiresAt = invoice.dueDate;
        await appointment.save();

        return res.json({
          message: "Đã tạo hóa đơn tạm ứng (compute)",
          invoice,
          appointment,
        });
      } catch (err) {
        console.error("Compute pricing failed (create path):", err);
        return res
          .status(400)
          .json({ message: "Không có khoản phí để tạo hóa đơn" });
      }
    }

    // Create invoice (normal path)
    const invoice = await Invoice.create({
      appointmentId,
      type: "consultation",
      items,
      subtotal,
      insuranceCoverage: totalInsurance,
      patientAmount: totalPatient,
      dueDate: new Date(Date.now() + PAYMENT_HOLD_MS), // payment hold duration from now
    });

    // Update appointment
    appointment.status = AppointmentStatus.AWAIT_PAYMENT;
    appointment.consultationFee = feeInput;
    appointment.depositAmount = depositInput;
    appointment.totalAmount = subtotal;
    appointment.insuranceCoverage = totalInsurance;
    appointment.patientAmount = totalPatient;
    // sync holdExpiresAt with invoice due date
    appointment.holdExpiresAt = invoice.dueDate;
    await appointment.save();

    res.json({
      message: "Đã tạo hóa đơn tạm ứng",
      invoice,
      appointment,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error creating consultation invoice:", err);
    res.status(500).json({ message: "Lỗi tạo hóa đơn", error: err.message });
  }
};

// Process payment
export const processPayment = async (req: Request, res: Response) => {
  try {
    const { appointmentId, invoiceId, paymentMethod, transactionId } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: "Không tìm thấy hóa đơn" });
    }

    // Enforce hold expiration: do not allow processing payment if hold or invoice due date expired
    const now = new Date();
    if (
      appointment.status === AppointmentStatus.PAYMENT_OVERDUE ||
      (appointment.holdExpiresAt && appointment.holdExpiresAt <= now) ||
      (invoice.dueDate && invoice.dueDate <= now)
    ) {
      if (appointment.status !== AppointmentStatus.PAYMENT_OVERDUE) {
        appointment.status = AppointmentStatus.PAYMENT_OVERDUE;
        await appointment.save();
        // release schedule slot
        try {
          if (appointment.scheduleId) {
            await DoctorSchedule.findByIdAndUpdate(
              appointment.scheduleId as any,
              {
                isBooked: false,
              }
            );
          }
        } catch (e) {
          console.error(
            "Failed to release schedule on overdue (processPayment)",
            e
          );
        }
      }
      return res
        .status(400)
        .json({ message: "Hết thời gian thanh toán. Đơn đặt bị quá hạn." });
    }

    // Create payment record
    const payment = await Payment.create({
      appointmentId,
      invoiceId,
      amount: invoice.patientAmount,
      status: PaymentStatus.CAPTURED,
      paymentMethod,
      transactionId,
      capturedAt: new Date(),
    });

    // Update invoice
    invoice.status = PaymentStatus.CAPTURED;
    invoice.paidAt = new Date();
    await invoice.save();

    // Update appointment
    appointment.status = AppointmentStatus.CONFIRMED;
    appointment.paymentStatus = PaymentStatus.CAPTURED;
    appointment.confirmedAt = new Date();
    await appointment.save();

    res.json({
      message: "Thanh toán thành công",
      payment,
      appointment,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error processing payment:", err);
    res
      .status(500)
      .json({ message: "Lỗi xử lý thanh toán", error: err.message });
  }
};

// Create final settlement invoice after consultation
export const createFinalInvoice = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const { additionalServices, diagnosis, prescription } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
    }

    if (appointment.status !== AppointmentStatus.IN_CONSULT) {
      return res.status(400).json({ message: "Lịch hẹn chưa bắt đầu khám" });
    }

    // Calculate additional services cost
    const additionalCost =
      additionalServices?.reduce(
        (sum: number, service: any) => sum + service.cost,
        0
      ) || 0;

    const totalAdditionalCost = additionalCost;
    const insuranceCoverageAmount =
      (totalAdditionalCost * (appointment.insuranceCoverage || 0)) / 100;
    const patientAdditionalAmount =
      totalAdditionalCost - insuranceCoverageAmount;

    // Create final invoice
    const invoice = await Invoice.create({
      appointmentId,
      type: "final_settlement",
      items:
        additionalServices?.map((service: any) => ({
          type: PaymentType.ADDITIONAL_SERVICES,
          description: service.name,
          amount: service.cost,
          insuranceCoverage:
            (appointment.insuranceCoverage || 0) > 0
              ? InsuranceCoverage.PARTIAL_COVERAGE
              : InsuranceCoverage.NO_COVERAGE,
          insuranceAmount:
            (service.cost * (appointment.insuranceCoverage || 0)) / 100,
          patientAmount:
            service.cost -
            (service.cost * (appointment.insuranceCoverage || 0)) / 100,
        })) || [],
      subtotal: totalAdditionalCost,
      insuranceCoverage: insuranceCoverageAmount,
      patientAmount: patientAdditionalAmount,
    });

    // Update appointment
    appointment.status = AppointmentStatus.READY_TO_DISCHARGE;
    appointment.diagnosis = diagnosis;
    appointment.prescription = prescription;
    appointment.additionalServices = additionalServices;
    await appointment.save();

    res.json({
      message: "Đã tạo hóa đơn quyết toán",
      invoice,
      appointment,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error creating final invoice:", err);
    res
      .status(500)
      .json({ message: "Lỗi tạo hóa đơn quyết toán", error: err.message });
  }
};

// Get payment history
export const getPaymentHistory = async (req: Request, res: Response) => {
  try {
    const patientId = (req as any).patientId; // from patient auth middleware
    if (!patientId) {
      return res.status(401).json({ message: "Token bệnh nhân không hợp lệ" });
    }

    // Find appointments that belong to this patient, then query payments linked to them.
    const patientAppointments = await Appointment.find({ patientId }).select(
      "_id"
    );
    const appointmentIds = patientAppointments.map((a) => a._id);

    const payments = await Payment.find({
      appointmentId: { $in: appointmentIds },
    })
      .populate({
        path: "appointmentId",
        select: "_id appointmentDate appointmentTime status",
        populate: { path: "doctorId", select: "name specialty" },
      })
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error getting payment history:", err);
    res
      .status(500)
      .json({ message: "Lỗi lấy lịch sử thanh toán", error: err.message });
  }
};

// Get payment status for appointment
export const getPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const patientId = (req as any).patientId;

    const appointment = await Appointment.findById(appointmentId)
      .populate("patientId", "name email phone")
      .populate("doctorId", "name specialty");

    if (!appointment) {
      return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
    }

    // Verify patient can only access their own appointments
    if (appointment.patientId._id.toString() !== patientId) {
      return res
        .status(403)
        .json({ message: "Không có quyền truy cập thông tin thanh toán này" });
    }

    let invoices = await Invoice.find({ appointmentId });
    const payments = await Payment.find({ appointmentId });

    // If there are no invoices but the appointment is already in a payment-related
    // status, attempt to compute pricing and create a pending consultation invoice
    // so the patient UI can display it immediately.
    if (
      (!invoices || invoices.length === 0) &&
      (appointment.status === AppointmentStatus.DOCTOR_APPROVED ||
        appointment.status === AppointmentStatus.AWAIT_PAYMENT)
    ) {
      try {
        const parseService = (note?: string) => {
          if (!note) return "";
          const m = note.match(/\[Dịch vụ\]\s*([^|\n]+)/);
          return m?.[1]?.trim() || "";
        };

        const SERVICE_LABEL_MAP: Record<string, string> = {
          KHAM_CHUYEN_KHOA: "Khám chuyên khoa",
          KHAM_TONG_QUAT: "Khám tổng quát",
          GOI_DINH_KY: "Khám định kỳ",
          TU_VAN_DINH_DUONG: "Tư vấn dinh dưỡng",
          TU_VAN_TAM_LY: "Tư vấn tâm lý",
        };
        const rawSvcFromType = appointment.serviceType
          ? SERVICE_LABEL_MAP[String(appointment.serviceType)] ||
            String(appointment.serviceType)
          : "";
        const fromNote = parseService(appointment.note) || "";
        const normalizeServiceLabel = (s: string) => {
          if (!s) return "";
          const idx = s.indexOf("(");
          return (idx >= 0 ? s.slice(0, idx) : s).trim();
        };
        const serviceCode =
          normalizeServiceLabel(rawSvcFromType) ||
          normalizeServiceLabel(fromNote) ||
          "";
        const durationMin = 45; // fallback when unknown
        const startAt =
          appointment.appointmentDate && appointment.appointmentTime
            ? new Date(
                `${appointment.appointmentDate}T${appointment.appointmentTime}:00`
              ).toISOString()
            : new Date().toISOString();
        const bhytEligible = (appointment.insuranceCoverage || 0) > 0;
        const copayRate = (appointment.insuranceCoverage || 0) / 100;

        const computed = await computeConsultPrice({
          serviceCode,
          doctorId: resolveDoctorId(appointment.doctorId),
          durationMin,
          startAt,
          bhytEligible,
          copayRate,
        });

        const mappedItems = computed.items.map((it: any) => {
          const type =
            it.component === "facility"
              ? PaymentType.CONSULTATION_FEE
              : PaymentType.ADDITIONAL_SERVICES;
          return {
            type,
            description: it.description,
            amount: it.amount,
            insuranceCoverage:
              it.payer === "bhyt"
                ? InsuranceCoverage.PARTIAL_COVERAGE
                : InsuranceCoverage.NO_COVERAGE,
            insuranceAmount: it.insuranceAmount || 0,
            patientAmount: it.patientAmount || 0,
          };
        });

        const invoice = await Invoice.create({
          appointmentId,
          type: "consultation",
          items: mappedItems,
          subtotal: computed.totals.total,
          insuranceCoverage: computed.totals.bhyt,
          patientAmount: computed.totals.patient,
          dueDate: new Date(Date.now() + PAYMENT_HOLD_MS),
        });

        // update appointment totals as well
        appointment.status = AppointmentStatus.AWAIT_PAYMENT;
        appointment.totalAmount = computed.totals.total;
        appointment.insuranceCoverage = computed.totals.bhyt;
        appointment.patientAmount = computed.totals.patient;
        // sync appointment hold expiry with invoice dueDate
        appointment.holdExpiresAt = invoice.dueDate;
        await appointment.save();

        invoices = [invoice];
      } catch (err) {
        console.error("Failed to compute/create invoice on status fetch:", err);
        // If compute failed, try to create invoice from appointment-stored fees
        try {
          const fee = Number(appointment.consultationFee || 0);
          const deposit = Number(appointment.depositAmount || 0);
          if (fee > 0 || deposit > 0) {
            const items: any[] = [];
            if (fee > 0) {
              items.push({
                type: "consultation_fee",
                description: "Phí khám cơ bản",
                amount: fee,
                insuranceAmount: 0,
                patientAmount: fee,
              });
            }
            if (deposit > 0) {
              items.push({
                type: "deposit",
                description: "Đặt cọc giữ chỗ",
                amount: deposit,
                insuranceAmount: 0,
                patientAmount: deposit,
              });
            }
            const subtotal = fee + deposit;
            const invoice = await Invoice.create({
              appointmentId,
              type: "consultation",
              items,
              subtotal,
              insuranceCoverage: 0,
              patientAmount: subtotal,
              dueDate: new Date(Date.now() + PAYMENT_HOLD_MS),
            });
            appointment.status = AppointmentStatus.AWAIT_PAYMENT;
            appointment.totalAmount = subtotal;
            appointment.patientAmount = subtotal;
            appointment.paymentStatus = PaymentStatus.PENDING;
            // sync appointment hold expiry with invoice dueDate
            appointment.holdExpiresAt = invoice.dueDate;
            await appointment.save();
            invoices = [invoice];
          }
        } catch (fallbackErr) {
          console.error("Fallback invoice create failed:", fallbackErr);
        }
      }
    }

    res.json({
      appointment,
      invoices,
      payments,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error getting payment status:", err);
    res
      .status(500)
      .json({ message: "Lỗi lấy trạng thái thanh toán", error: err.message });
  }
};

// Get payment status by invoice id
export const getPaymentStatusByInvoice = async (
  req: Request,
  res: Response
) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await Invoice.findById(invoiceId).populate("appointmentId");
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    const payment = await Payment.findOne({ invoiceId: invoice._id });

    res.json({ invoice, payment, appointment: invoice.appointmentId });
  } catch (err: unknown) {
    const e = err as Error;
    console.error("Error getting payment status by invoice:", e);
    res.status(500).json({ message: "Internal error", error: e.message });
  }
};

// Get payment status by PayOS order code (payosOrderId) or paymentLinkId
export const getPaymentStatusByOrder = async (req: Request, res: Response) => {
  try {
    const { orderCode } = req.params;
    if (!orderCode)
      return res.status(400).json({ message: "Missing order code" });

    // Find invoice by saved payosOrderId or any stored payment link id in raw fields
    const invoice = await Invoice.findOne({
      $or: [
        { payosOrderId: String(orderCode) },
        { paymentLinkId: String(orderCode) },
        { "raw.paymentLinkId": String(orderCode) },
      ],
    }).populate("appointmentId");

    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    const payment = await Payment.findOne({ invoiceId: invoice._id });

    res.json({ invoice, payment, appointment: invoice.appointmentId });
  } catch (err: unknown) {
    const e = err as Error;
    console.error("Error getting payment status by order:", e);
    res.status(500).json({ message: "Internal error", error: e.message });
  }
};

// Refund payment
export const refundPayment = async (req: Request, res: Response) => {
  try {
    const { paymentId, refundAmount, reason } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Không tìm thấy giao dịch" });
    }

    // Update payment
    payment.status = PaymentStatus.REFUNDED;
    payment.refundedAt = new Date();
    payment.refundAmount = refundAmount || payment.amount;
    await payment.save();

    // Update appointment
    const appointment = await Appointment.findById(payment.appointmentId);
    if (appointment) {
      appointment.status = AppointmentStatus.CANCELLED;
      appointment.cancelledAt = new Date();
      appointment.cancelledBy = "system";
      appointment.cancellationReason = reason || "Hoàn tiền";
      await appointment.save();
    }

    res.json({
      message: "Hoàn tiền thành công",
      payment,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error refunding payment:", err);
    res.status(500).json({ message: "Lỗi hoàn tiền", error: err.message });
  }
};

// VNPay Integration

// Create VNPay payment URL
export const createVNPayPayment = async (req: Request, res: Response) => {
  try {
    const { appointmentId, invoiceId } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: "Không tìm thấy hóa đơn" });
    }

    // Check if payment is still valid (not expired)
    const now = new Date();
    if (
      appointment.status === AppointmentStatus.PAYMENT_OVERDUE ||
      (appointment.holdExpiresAt && appointment.holdExpiresAt <= now) ||
      (invoice.dueDate && invoice.dueDate <= now)
    ) {
      return res
        .status(400)
        .json({ message: "Hết thời gian thanh toán. Đơn đặt bị quá hạn." });
    }

    // Generate unique transaction reference
    const txnRef = vnpayService.generateTxnRef(appointmentId);

    // Get client IP
    const clientIp = vnpayService.getClientIpAddress(req);

    console.log("VNPay Payment Parameters:", {
      amount: invoice.patientAmount,
      txnRef,
      appointmentId,
      clientIp,
      orderInfo: `Thanh toan lich kham - Ma: ${appointmentId}`,
    });

    // Create payment URL
    // Allow overriding returnUrl from client in non-production for dev convenience
    const requestedReturnUrl = (req.body && req.body.returnUrl) || undefined;
    const returnUrlToUse =
      process.env.NODE_ENV !== "production" && requestedReturnUrl
        ? String(requestedReturnUrl)
        : undefined;

    const paymentUrl = vnpayService.createPaymentUrl({
      vnp_Amount: invoice.patientAmount,
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Thanh toan lich kham - Ma: ${appointmentId}`,
      vnp_IpAddr: clientIp,
      vnp_Locale: "vn",
      vnp_OrderType: "other",
      vnp_ReturnUrl: returnUrlToUse,
    });

    console.log("Generated VNPay URL:", paymentUrl);

    // Store transaction reference in invoice for later verification
    invoice.vnpayTxnRef = txnRef;
    await invoice.save();

    res.json({
      message: "Tạo link thanh toán VNPay thành công",
      paymentUrl,
      txnRef,
      amount: invoice.patientAmount,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error creating VNPay payment:", err);
    res.status(500).json({
      message: "Lỗi tạo link thanh toán VNPay",
      error: err.message,
    });
  }
};

// Create PayOS payment link (patient or admin can call)
export const createPayosLink = async (req: Request, res: Response) => {
  try {
    console.log("createPayosLink called", {
      body: req.body,
      PAYOS_CONFIG: {
        clientId: !!process.env.PAYOS_CLIENT_ID,
        apiKey: !!process.env.PAYOS_API_KEY,
        checksum: !!process.env.PAYOS_CHECKSUM_KEY,
      },
    });
    const {
      invoiceId,
      amount: amountInBody,
      description: descInBody,
    } = req.body || {};

    const payosClientId = process.env.PAYOS_CLIENT_ID;
    const payosApiKey = process.env.PAYOS_API_KEY;
    const payosChecksum = process.env.PAYOS_CHECKSUM_KEY;

    if (!payosClientId || !payosApiKey) {
      return res
        .status(400)
        .json({ message: "PayOS credentials not configured" });
    }

    // resolve amount: prefer body, then invoice patientAmount
    let amount = 0;
    if (typeof amountInBody === "number" && Number.isFinite(amountInBody)) {
      amount = Math.round(amountInBody);
    } else if (invoiceId) {
      const inv = await Invoice.findById(invoiceId);
      if (!inv) return res.status(404).json({ message: "Invoice not found" });
      amount = Math.round(Number(inv.patientAmount || 0));
    } else {
      return res.status(400).json({ message: "Missing amount or invoiceId" });
    }

    const orderCode = makeNumericOrderCode();
    const description = truncateDesc(
      String(descInBody || `Thanh toan don ${orderCode}`)
    );

    // If an invoiceId was provided, try to reuse any existing PayOS order saved
    // on the invoice to avoid creating duplicate orders in PayOS.
    let existingInvoice = null as any;
    if (invoiceId) {
      existingInvoice = await Invoice.findById(invoiceId);
    }

    // If the invoice already has a payosOrderId or paymentLinkId, try to return
    // that instead of creating a new PayOS order. Also include invoiceId in
    // the response so the client can poll by invoice reliably.
    if (
      existingInvoice &&
      (existingInvoice.payosOrderId || existingInvoice.paymentLinkId)
    ) {
      // Attempt to return any previously-stored raw PayOS data if available.
      const rawData =
        (existingInvoice.raw && existingInvoice.raw.payos) || null;
      return res.json({
        invoiceId: existingInvoice._id,
        orderCode:
          existingInvoice.payosOrderId || existingInvoice.paymentLinkId || null,
        checkoutUrl: rawData?.checkoutUrl || null,
        qrUrl: rawData?.qrUrl || null,
        qrCode: rawData?.qrCode || null,
        qrImage: rawData?.qrImage || null,
        paymentLinkId: existingInvoice.paymentLinkId || null,
        raw: rawData || null,
        message: "Reused existing PayOS order",
      });
    }

    // instantiate SDK
    const { PayOS, exportKeys } = loadPayOS();
    if (typeof PayOS !== "function") {
      return res.status(500).json({
        message: "PayOS SDK not usable",
        exportKeys,
      });
    }

    const payos = new PayOS(payosClientId, payosApiKey, payosChecksum);

    const resp = await payos.paymentRequests.create({
      orderCode,
      amount,
      description,
      returnUrl: process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/payment/success?oc=${orderCode}`
        : undefined,
      cancelUrl: process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/payment/cancel?oc=${orderCode}`
        : undefined,
      expiredAt: Math.floor((Date.now() + 15 * 60 * 1000) / 1000), // 15 minutes
    });

    // resp may include { code, desc, data } or direct data. Normalize.
    const data = (resp && (resp.data || resp)) || {};

    // Build a normalized qrUrl for clients: prefer explicit qr fields or checkoutUrl.
    const pickQrCandidate =
      data.qrCode ||
      data.qr ||
      data.qr_code ||
      data.qrImage ||
      data.qr_image ||
      data.checkoutUrl ||
      data.checkout_url ||
      data.url ||
      data.paymentUrl ||
      null;

    const ensureDataUrl = (v: any) => {
      if (!v || typeof v !== "string") return null;
      const s = v.trim();
      if (s.startsWith("data:")) return s;
      if (/^https?:\/\//i.test(s)) return s;
      const candidate = s.replace(/\s+/g, "");
      if (/^[A-Za-z0-9+/=]+$/.test(candidate) && candidate.length > 100) {
        return `data:image/png;base64,${candidate}`;
      }
      return null;
    };

    const qrUrl =
      ensureDataUrl(pickQrCandidate) ||
      (typeof pickQrCandidate === "string" ? pickQrCandidate : null);

    // persist orderCode to invoice if invoiceId provided. Use an atomic
    // update so concurrent requests won't overwrite an existing payosOrderId.
    if (invoiceId) {
      try {
        await Invoice.findOneAndUpdate(
          { _id: invoiceId, payosOrderId: { $exists: false } },
          { $set: { payosOrderId: String(orderCode), raw: { payos: data } } },
          { new: true }
        );
      } catch (e) {
        console.warn("Failed to persist payosOrderId on invoice", e);
      }
    }
    return res.json({
      invoiceId: invoiceId || null,
      orderCode,
      checkoutUrl:
        data.checkoutUrl || data.checkout_url || data.url || data.paymentUrl,
      qrUrl,
      qrCode:
        data.qrCode ||
        data.qr_code ||
        data.qr ||
        data.qrImage ||
        data.qr_image ||
        null,
      qrImage: data.qrImage || data.qr_image || null,
      paymentLinkId:
        data.paymentLinkId || data.payment_link_id || data.id || null,
      raw: data,
    });
  } catch (err: unknown) {
    const e = err as Error;
    console.error("Error creating PayOS link:", e);
    res
      .status(500)
      .json({ message: "Error creating PayOS link", error: e.message });
  }
};

// Temporary debug endpoint: attempt to instantiate PayOS SDK and create a minimal
// payment link. Returns raw SDK response or detailed error to help diagnose 500s.
export const debugCreatePayosLink = async (req: Request, res: Response) => {
  try {
    const { invoiceId, amount: amountInBody } = req.body || {};

    const payosClientId = process.env.PAYOS_CLIENT_ID;
    const payosApiKey = process.env.PAYOS_API_KEY;
    const payosChecksum = process.env.PAYOS_CHECKSUM_KEY;

    if (!payosClientId || !payosApiKey) {
      return res.status(503).json({
        message: "PayOS not configured",
        hasClientId: !!payosClientId,
        hasApiKey: !!payosApiKey,
        hasChecksum: !!payosChecksum,
      });
    }

    // Try to require the SDK and inspect exports
    const { PayOS, exportKeys } = loadPayOS();
    if (typeof PayOS !== "function") {
      return res.status(500).json({
        message: "PayOS SDK shape unexpected",
        typeofPayOS: typeof PayOS,
        exportKeys,
      });
    }

    const payos = new PayOS(payosClientId, payosApiKey, payosChecksum);

    const amount =
      typeof amountInBody === "number" && Number.isFinite(amountInBody)
        ? Math.round(amountInBody)
        : 100; // small default for debug

    const orderCode = makeNumericOrderCode();

    const resp = await payos.paymentRequests.create({
      orderCode,
      amount,
      description: truncateDesc(`Debug create ${orderCode}`),
      returnUrl: process.env.FRONTEND_URL,
      cancelUrl: process.env.FRONTEND_URL,
    });

    return res.json({
      message: "Debug create succeeded",
      orderCode,
      amount,
      exportKeys,
      resp,
    });
  } catch (err: unknown) {
    const e = err as any;
    console.error("Debug create PayOS failed:", e && (e.stack || e));
    return res.status(500).json({
      message: "Debug create failed",
      error: e?.message || String(e),
      stack: e?.stack || undefined,
    });
  }
};

// Handle VNPay return (callback from VNPay)
export const handleVNPayReturn = async (req: Request, res: Response) => {
  try {
    const query = req.query as any;

    // Verify the return data
    const verificationResult = vnpayService.verifyReturnUrl(query);

    if (!verificationResult.isValid) {
      return res.status(400).json({
        message: "Chữ ký không hợp lệ",
        success: false,
      });
    }

    const { vnp_TxnRef, vnp_TransactionNo, vnp_Amount, vnp_ResponseCode } =
      query;

    // Find invoice by transaction reference
    const invoice = await Invoice.findOne({ vnpayTxnRef: vnp_TxnRef });
    if (!invoice) {
      return res.status(404).json({
        message: "Không tìm thấy hóa đơn",
        success: false,
      });
    }

    const appointment = await Appointment.findById(invoice.appointmentId);
    if (!appointment) {
      return res.status(404).json({
        message: "Không tìm thấy lịch hẹn",
        success: false,
      });
    }

    if (verificationResult.isSuccess) {
      // Payment successful
      const payment = await Payment.create({
        appointmentId: appointment._id,
        invoiceId: invoice._id,
        amount: invoice.patientAmount,
        status: PaymentStatus.CAPTURED,
        paymentMethod: "vnpay",
        transactionId: vnp_TransactionNo,
        vnpayTxnRef: vnp_TxnRef,
        vnpayResponseCode: vnp_ResponseCode,
        capturedAt: new Date(),
      });

      // Update invoice
      invoice.status = PaymentStatus.CAPTURED;
      invoice.paidAt = new Date();
      invoice.vnpayTransactionNo = vnp_TransactionNo;
      await invoice.save();

      // Update appointment
      appointment.status = AppointmentStatus.CONFIRMED;
      appointment.paymentStatus = PaymentStatus.CAPTURED;
      appointment.confirmedAt = new Date();
      await appointment.save();

      // Redirect to VNPay return handler (client side)
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4000";
      return res.redirect(
        `${frontendUrl}/payment/vnpay/return?vnp_TxnRef=${vnp_TxnRef}&vnp_TransactionNo=${vnp_TransactionNo}&vnp_ResponseCode=${vnp_ResponseCode}&vnp_TransactionStatus=00`
      );
    } else {
      // Payment failed
      const payment = await Payment.create({
        appointmentId: appointment._id,
        invoiceId: invoice._id,
        amount: invoice.patientAmount,
        status: PaymentStatus.FAILED,
        paymentMethod: "vnpay",
        transactionId: vnp_TransactionNo || "",
        vnpayTxnRef: vnp_TxnRef,
        vnpayResponseCode: vnp_ResponseCode,
        failedAt: new Date(),
      });

      // Update invoice status
      invoice.status = PaymentStatus.FAILED;
      await invoice.save();

      // Redirect to VNPay return handler (client side)
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4000";
      return res.redirect(
        `${frontendUrl}/payment/vnpay/return?vnp_TxnRef=${vnp_TxnRef}&vnp_ResponseCode=${vnp_ResponseCode}&vnp_TransactionStatus=01`
      );
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error handling VNPay return:", err);

    // Redirect to error page
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4000";
    return res.redirect(
      `${frontendUrl}/payment/vnpay/return?error=system_error`
    );
  }
};

// Confirm VNPay result when VNPay redirects to client first.
// The frontend should POST the VNPay query params (as JSON) to this endpoint
// so the server can verify and record the payment.
export const confirmVNPayFromClient = async (req: Request, res: Response) => {
  try {
    console.log("VNPay client confirmation received:", {
      body: req.body,
      rawQuery: req.body?.rawQuery,
    });

    // Support two modes from client:
    // 1) send parsed JSON body of params => req.body is an object
    // 2) send raw query string as { rawQuery: 'vnp_Amount=...&vnp_SecureHash=...' }
    const rawQuery = (req.body && req.body.rawQuery) || undefined;
    let verificationResult;
    if (rawQuery) {
      verificationResult = vnpayService.verifyReturnRaw(rawQuery);
    } else {
      const query = req.body as any;
      verificationResult = vnpayService.verifyReturnUrl(query);
    }

    if (!verificationResult.isValid) {
      console.error("VNPay signature verification failed:", verificationResult);
      return res
        .status(400)
        .json({ message: "Chữ ký không hợp lệ", success: false });
    }

    // unify params: verificationResult.data may be a map of decoded values (object)
    // or a map of raw encoded values (when rawQuery used). Normalize access via getParam()
    const params = verificationResult.data as Record<string, any>;
    const rawMode = !!rawQuery;
    const getParam = (k: string) => {
      const v = params[k];
      if (v === undefined || v === null) return undefined;
      if (rawMode && typeof v === "string") {
        // v contains encoded value but with + for spaces (we normalized %20->+ earlier)
        // Convert + back to %20 then decode
        try {
          return decodeURIComponent(v.replace(/\+/g, "%20"));
        } catch {
          return v;
        }
      }
      return v;
    };

    const vnp_TxnRef = getParam("vnp_TxnRef");
    const vnp_TransactionNo = getParam("vnp_TransactionNo");
    const vnp_Amount = getParam("vnp_Amount");
    const vnp_ResponseCode = getParam("vnp_ResponseCode");

    // Find invoice by transaction reference
    const invoice = await Invoice.findOne({ vnpayTxnRef: vnp_TxnRef });
    if (!invoice) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy hóa đơn", success: false });
    }

    const appointment = await Appointment.findById(invoice.appointmentId);
    if (!appointment) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lịch hẹn", success: false });
    }

    if (verificationResult.isSuccess) {
      // Check if payment already exists to avoid duplicates
      const existingPayment = await Payment.findOne({
        invoiceId: invoice._id,
        vnpayTxnRef: vnp_TxnRef,
        transactionId: vnp_TransactionNo,
        status: PaymentStatus.CAPTURED,
      });

      if (existingPayment) {
        // Payment already exists, return it
        return res.json({
          message: "Giao dịch đã được xử lý trước đó",
          success: true,
          payment: existingPayment,
          invoice,
          appointment,
        });
      }

      // Create new payment if not exists
      const payment = await Payment.create({
        appointmentId: appointment._id,
        patientId: appointment.patientId,
        invoiceId: invoice._id,
        amount: invoice.patientAmount,
        status: PaymentStatus.CAPTURED,
        paymentMethod: "vnpay",
        transactionId: vnp_TransactionNo,
        vnpayTxnRef: vnp_TxnRef,
        vnpayResponseCode: vnp_ResponseCode,
        description: `Thanh toán qua VNPay - Mã giao dịch: ${vnp_TransactionNo}`,
        capturedAt: new Date(),
      });

      // Update invoice
      invoice.status = PaymentStatus.CAPTURED;
      invoice.paidAt = new Date();
      invoice.vnpayTransactionNo = vnp_TransactionNo;
      await invoice.save();

      // Update appointment
      appointment.status = AppointmentStatus.CONFIRMED;
      appointment.paymentStatus = PaymentStatus.CAPTURED;
      appointment.confirmedAt = new Date();
      await appointment.save();

      return res.json({
        message: "Thanh toán thành công",
        success: true,
        payment,
        invoice,
        appointment,
      });
    } else {
      // Payment failed
      const payment = await Payment.create({
        appointmentId: appointment._id,
        patientId: appointment.patientId,
        invoiceId: invoice._id,
        amount: invoice.patientAmount,
        status: PaymentStatus.FAILED,
        paymentMethod: "vnpay",
        transactionId: vnp_TransactionNo || "",
        vnpayTxnRef: vnp_TxnRef,
        vnpayResponseCode: vnp_ResponseCode,
        description: `Thanh toán VNPay thất bại - Mã giao dịch: ${
          vnp_TransactionNo || "N/A"
        }`,
        failedAt: new Date(),
      });

      // Update invoice status
      invoice.status = PaymentStatus.FAILED;
      await invoice.save();

      return res.json({
        message: "Thanh toán không thành công",
        success: false,
        payment,
        invoice,
      });
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error confirming VNPay from client:", err);
    res
      .status(500)
      .json({ message: "Lỗi xử lý kết quả VNPay", error: err.message });
  }
};

// Get VNPay payment status
export const getVNPayPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { txnRef } = req.params;

    const invoice = await Invoice.findOne({ vnpayTxnRef: txnRef }).populate(
      "appointmentId"
    );

    if (!invoice) {
      return res.status(404).json({ message: "Không tìm thấy giao dịch" });
    }

    const payment = await Payment.findOne({
      invoiceId: invoice._id,
      paymentMethod: "vnpay",
    });

    res.json({
      invoice,
      payment,
      appointment: invoice.appointmentId,
      status: payment?.status || "pending",
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error getting VNPay payment status:", err);
    res.status(500).json({
      message: "Lỗi lấy trạng thái thanh toán",
      error: err.message,
    });
  }
};

// Generate QR for bank transfer for a given invoice
export const generateBankTransferQr = async (req: Request, res: Response) => {
  try {
    const { invoiceId, bankAccountId } = req.body;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice)
      return res.status(404).json({ message: "Không tìm thấy hóa đơn" });

    // Choose bank account: provided or first active
    let account = null as any;
    if (bankAccountId) {
      account = await BankAccount.findById(bankAccountId);
    }
    if (!account) {
      account = await BankAccount.findOne({ active: true }).sort({
        createdAt: 1,
      });
    }

    if (!account)
      return res
        .status(404)
        .json({ message: "Chưa cấu hình tài khoản nhận tiền" });

    // Enforce PayOS-first: create a PayOS order and return its checkout information.
    const payosClientId = process.env.PAYOS_CLIENT_ID;
    const payosApiKey = process.env.PAYOS_API_KEY;
    const payosChecksum = process.env.PAYOS_CHECKSUM_KEY;

    if (!payosClientId || !payosApiKey) {
      return res.status(503).json({
        message: "PayOS không được cấu hình. Vui lòng liên hệ quản trị.",
      });
    }

    try {
      // If invoice already has a payosOrderId or paymentLinkId, avoid creating a
      // new order in PayOS. Return the previously saved PayOS info if present.
      if (invoice.payosOrderId || (invoice as any).paymentLinkId) {
        const existingRaw = (invoice as any).raw?.payos || null;
        const pickQrCandidate =
          existingRaw?.qrCode ||
          existingRaw?.qr ||
          existingRaw?.qr_code ||
          existingRaw?.qrImage ||
          existingRaw?.qr_image ||
          existingRaw?.checkoutUrl ||
          existingRaw?.checkout_url ||
          existingRaw?.url ||
          existingRaw?.paymentUrl ||
          null;
        const ensureDataUrl = (v: any) => {
          if (!v || typeof v !== "string") return null;
          const s = v.trim();
          if (s.startsWith("data:")) return s;
          if (/^https?:\/\//i.test(s)) return s;
          const candidate = s.replace(/\s+/g, "");
          if (/^[A-Za-z0-9+/=]+$/.test(candidate) && candidate.length > 100) {
            return `data:image/png;base64,${candidate}`;
          }
          return null;
        };
        const qrUrl =
          ensureDataUrl(pickQrCandidate) ||
          (typeof pickQrCandidate === "string" ? pickQrCandidate : null);

        return res.json({
          invoiceId: invoice._id,
          account: {
            id: account._id,
            name: account.name,
            bankName: account.bankName,
            accountNumber: account.accountNumber,
            branch: account.branch,
            note: account.note,
          },
          amount: Math.round(Number(invoice.patientAmount || 0)),
          qrUrl,
          payosCheckout: {
            orderCode:
              invoice.payosOrderId || (invoice as any).paymentLinkId || null,
            checkoutUrl: existingRaw?.checkoutUrl || null,
            qrCode: existingRaw?.qrCode || null,
            qrImage: existingRaw?.qrImage || null,
            paymentLinkId: (invoice as any).paymentLinkId || null,
            raw: existingRaw || null,
          },
          message: "Reused existing PayOS order",
        });
      }

      const { PayOS, exportKeys } = loadPayOS();
      if (typeof PayOS !== "function") {
        return res
          .status(500)
          .json({ message: "PayOS SDK không khả dụng", exportKeys });
      }

      const payos = new PayOS(payosClientId, payosApiKey, payosChecksum);

      const amount = Math.round(Number(invoice.patientAmount || 0));
      if (!amount || amount <= 0) {
        console.warn("Invalid invoice amount for PayOS order", {
          invoiceId: invoice._id,
          amount,
        });
        return res
          .status(400)
          .json({ message: "Số tiền hóa đơn không hợp lệ để tạo đơn PayOS" });
      }
      const orderCode = makeNumericOrderCode();
      const description = truncateDesc(
        `Thanh toan lich kham - ${String(invoice._id)}`
      );

      const resp = await payos.paymentRequests.create({
        orderCode,
        amount,
        description,
        returnUrl: process.env.FRONTEND_URL
          ? `${process.env.FRONTEND_URL}/payment/success`
          : undefined,
        cancelUrl: process.env.FRONTEND_URL
          ? `${process.env.FRONTEND_URL}/payment/cancel`
          : undefined,
      });

      const data = (resp && (resp.data || resp)) || {};

      try {
        const persisted = data.orderCode || orderCode;
        // Atomically set payosOrderId/raw only if not present yet to avoid races
        await Invoice.findOneAndUpdate(
          { _id: invoice._id, payosOrderId: { $exists: false } },
          { $set: { payosOrderId: String(persisted), raw: { payos: data } } },
          { new: true }
        );
      } catch (e) {
        console.warn("Failed to persist payosOrderId on invoice", e);
      }

      // normalize payos fields to top-level for FE convenience
      const pickQrCandidate =
        data.qrCode ||
        data.qr ||
        data.qr_code ||
        data.qrImage ||
        data.qr_image ||
        data.checkoutUrl ||
        data.checkout_url ||
        data.url ||
        data.paymentUrl ||
        null;
      const ensureDataUrl = (v: any) => {
        if (!v || typeof v !== "string") return null;
        const s = v.trim();
        if (s.startsWith("data:")) return s;
        if (/^https?:\/\//i.test(s)) return s;
        const candidate = s.replace(/\s+/g, "");
        if (/^[A-Za-z0-9+/=]+$/.test(candidate) && candidate.length > 100) {
          return `data:image/png;base64,${candidate}`;
        }
        return null;
      };
      const qrUrl =
        ensureDataUrl(pickQrCandidate) ||
        (typeof pickQrCandidate === "string" ? pickQrCandidate : null);

      return res.json({
        invoiceId: invoice._id,
        account: {
          id: account._id,
          name: account.name,
          bankName: account.bankName,
          accountNumber: account.accountNumber,
          branch: account.branch,
          note: account.note,
        },
        amount,
        qrUrl,
        payosCheckout: {
          orderCode: data.orderCode || orderCode,
          checkoutUrl:
            data.checkoutUrl ||
            data.checkout_url ||
            data.url ||
            data.paymentUrl,
          qrCode:
            data.qrCode ||
            data.qr_code ||
            data.qr ||
            data.qrImage ||
            data.qr_image ||
            null,
          qrImage: data.qrImage || data.qr_image || null,
          paymentLinkId:
            data.paymentLinkId || data.payment_link_id || data.id || null,
          raw: data,
        },
      });
    } catch (e: any) {
      console.error("PayOS createPaymentLink failed:", e?.stack || e);
      // surface SDK error message for easier debugging in dev; keep generic in production
      return res.status(500).json({
        message: "Tạo đơn PayOS thất bại",
        error: e?.message || String(e),
      });
    }
  } catch (err: unknown) {
    const e = err as Error;
    console.error("Error generating bank transfer QR", e);
    res
      .status(500)
      .json({ message: "Lỗi tạo mã QR chuyển khoản", error: e.message });
  }
};

// Handle PayOS webhook notifications
export const handlePayosWebhook = async (req: Request, res: Response) => {
  try {
    console.log("PayOS Webhook received:", {
      rawBody: (req as any).rawBody,
      body: req.body,
      headers: req.headers,
    });

    // Use official PayOS SDK helpers to verify webhook authenticity
    if (!process.env.PAYOS_CHECKSUM_KEY) {
      console.error(
        "PAYOS_CHECKSUM_KEY is not configured; cannot verify webhooks"
      );
      return res.status(200).json({ ok: true, note: "checksum key missing" });
    }

    let payload;
    try {
      // Try to parse rawBody if present
      if ((req as any).rawBody) {
        payload = JSON.parse((req as any).rawBody);
      } else {
        payload = req.body && typeof req.body === "object" ? req.body : {};
      }
    } catch (e) {
      console.error("Failed to parse webhook payload:", e);
      return res.status(200).json({ ok: true, note: "invalid payload" });
    }

    const foundSignatureRaw =
      payload && typeof payload.signature === "string" ? payload.signature : "";
    const signatureInBody = String(foundSignatureRaw)
      .replace(/^\s*(sha256=|sha256:|hmac=|hmac:)/i, "")
      .trim()
      .toLowerCase();

    if (!signatureInBody) {
      console.warn("PayOS webhook missing signature in body");
      return res.status(200).json({ ok: true, note: "missing signature" });
    }

    if (payload.data === undefined) {
      console.warn("PayOS webhook payload missing data field");
      return res.status(200).json({ ok: true, note: "missing data" });
    }

    const payosClientId = process.env.PAYOS_CLIENT_ID;
    const payosApiKey = process.env.PAYOS_API_KEY;
    const payosChecksum = process.env.PAYOS_CHECKSUM_KEY;

    const { PayOS, exportKeys } = loadPayOS();
    if (typeof PayOS !== "function") {
      console.error("PayOS SDK not available for webhook verification", {
        exportKeys,
      });
      return res.status(200).json({ ok: true, note: "sdk missing" });
    }

    let payosClient: any;
    try {
      payosClient = new PayOS({
        clientId: payosClientId,
        apiKey: payosApiKey,
        checksumKey: payosChecksum,
      });
    } catch (setupErr) {
      console.error("Failed to instantiate PayOS client for webhook verify", {
        error: setupErr instanceof Error ? setupErr.message : setupErr,
      });
      return res.status(200).json({ ok: true, note: "client init failed" });
    }

    let data: any;
    try {
      data = await payosClient.webhooks.verify(payload);
    } catch (verifyErr) {
      let expectedSignature: string | null = null;
      try {
        expectedSignature =
          (await payosClient.crypto.createSignatureFromObj(
            payload.data,
            payosClient.checksumKey
          )) || null;
      } catch (sigErr) {
        console.debug("Unable to compute expected PayOS signature", sigErr);
      }
      console.warn("PayOS webhook verification failed", {
        error: verifyErr instanceof Error ? verifyErr.message : verifyErr,
        expected: expectedSignature,
        signatureInBody,
      });
      return res.status(200).json({ ok: true, note: "bad signature" });
    }

    data = data || payload.data || {};

    const code = String(
      payload.code ?? payload.status ?? data?.code ?? ""
    ).trim();

    const orderCode = data.orderCode || data.order_code;
    const paymentLinkId =
      data.paymentLinkId || data.payment_link_id || data.paymentId || data.id;
    const transactionId =
      data.transactionId || data.txn || data.transaction_id || "";

    // find invoice by saved orderCode
    if (!orderCode) {
      console.warn("PayOS webhook missing orderCode in verified payload", {
        data,
      });
      return res.status(200).json({ ok: true, note: "invoice not found" });
    }

    const invoice = await Invoice.findOne({ payosOrderId: String(orderCode) });
    if (!invoice) {
      console.warn("PayOS webhook: invoice not found for orderCode", orderCode);
      return res.status(200).json({ ok: true, note: "invoice not found" });
    }

    const appt = await Appointment.findById(invoice.appointmentId);

    // Success when code === "00"
    if (String(code) === "00") {
      const txId = transactionId || paymentLinkId || "";
      const existed = await Payment.findOne({
        invoiceId: invoice._id,
        transactionId: txId,
      });
      if (!existed) {
        const appointment = await Appointment.findById(invoice.appointmentId);
        if (!appointment) {
          console.error("Appointment not found for invoice:", invoice._id);
          return res
            .status(200)
            .json({ ok: true, note: "appointment not found" });
        }

        await Payment.create({
          appointmentId: invoice.appointmentId,
          patientId: appointment.patientId,
          invoiceId: invoice._id,
          amount: invoice.patientAmount,
          status: PaymentStatus.CAPTURED,
          paymentMethod: "payos",
          transactionId: txId,
          description: `Thanh toán qua PayOS - Mã giao dịch: ${txId}`,
          capturedAt: new Date(),
        });
      }

      invoice.status = PaymentStatus.CAPTURED;
      invoice.paidAt = new Date();
      if (!invoice.paymentLinkId && paymentLinkId) {
        (invoice as any).paymentLinkId = String(paymentLinkId);
      }
      await invoice.save();

      if (appt) {
        appt.status = AppointmentStatus.CONFIRMED;
        appt.paymentStatus = PaymentStatus.CAPTURED;
        appt.confirmedAt = new Date();
        await appt.save();
      }

      return res.status(200).json({ ok: true });
    }

    // Failure path
    invoice.status = PaymentStatus.FAILED;
    await invoice.save();
    await Payment.create({
      appointmentId: invoice.appointmentId,
      invoiceId: invoice._id,
      amount: invoice.patientAmount,
      status: PaymentStatus.FAILED,
      paymentMethod: "payos",
      failedAt: new Date(),
      transactionId: transactionId || "",
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("PayOS webhook error:", e);
    // still return 200 so PayOS won't retry aggressively
    return res.status(200).json({ ok: true, note: "webhook exception" });
  }
};
