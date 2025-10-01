import { Request, Response } from "express";
import mongoose from "mongoose";
import Appointment from "../models/Appointment";
import Invoice from "../models/Invoice";
import Payment from "../models/Payment";
import DoctorSchedule from "../../doctor/models/DoctorSchedule";
import { computeConsultPrice } from "../../pricing/services/computePricing";
import {
  AppointmentStatus,
  PaymentStatus,
  PaymentType,
  InsuranceCoverage,
} from "../../../shared/types/appointment";
import { PAYMENT_HOLD_MS } from "../../../shared/constants/payment";

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

    // If hold expired or appointment already marked overdue, reject payment
    const now = new Date();
    if (
      appointment.status === AppointmentStatus.PAYMENT_OVERDUE ||
      (appointment.holdExpiresAt && appointment.holdExpiresAt <= now)
    ) {
      if (appointment.status !== AppointmentStatus.PAYMENT_OVERDUE) {
        appointment.status = AppointmentStatus.PAYMENT_OVERDUE;
        await appointment.save();
        // release the schedule slot so others can book
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
            "Failed to release schedule on overdue (create invoice path)",
            e
          );
        }
      }
      return res
        .status(400)
        .json({ message: "Hết thời gian thanh toán. Đơn đặt bị quá hạn." });
    }

    // Allow invoice creation when doctor already approved OR when appointment
    // was moved to await_payment (UI/flow may set await_payment first)
    if (
      appointment.status !== AppointmentStatus.DOCTOR_APPROVED &&
      appointment.status !== AppointmentStatus.AWAIT_PAYMENT
    ) {
      return res
        .status(400)
        .json({ message: "Lịch hẹn chưa được bác sĩ chấp nhận" });
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

        const serviceCode = parseService(appointment.note) || "";
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

        const serviceCode = parseService(appointment.note) || "";
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
