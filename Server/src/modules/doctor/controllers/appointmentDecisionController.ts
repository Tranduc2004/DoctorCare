import { Request, Response } from "express";
import mongoose from "mongoose";
import Appointment from "../../patient/models/Appointment";
import DoctorSchedule from "../models/DoctorSchedule";
import Invoice from "../../patient/models/Invoice";
import { computeConsultPrice } from "../../pricing/services/computePricing";
import {
  AppointmentStatus,
  PaymentStatus,
} from "../../../shared/types/appointment";
import { PAYMENT_HOLD_MS } from "../../../shared/constants/payment";
import { createNotification } from "../../../shared/services/notificationService";
import Encounter from "../../encounter/models/Encounter";
import MedicalRecord from "../../patient/models/MedicalRecord";

// Doctor approves appointment
export const approveAppointment = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const {
      doctorId,
      consultationFee,
      depositAmount,
      insuranceCoverage,
      notes,
    } = req.body;

    // Try to find the appointment for this doctor. Historically we required
    // the appointment to be in BOOKED state, but some UI flows may have moved
    // it to AWAIT_PAYMENT earlier. To ensure we still create invoices when
    // the doctor confirms, find by id+doctor and allow continuing while
    // preserving the previous 404 behaviour when no appointment exists.
    let appointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId,
    });

    if (!appointment) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lịch hẹn chờ xác nhận" });
    }

    // If the appointment exists but is not in BOOKED state, log a note and
    // continue — this increases robustness when the client updated status
    // before the doctor action and avoids silently skipping invoice creation.
    if (appointment.status !== AppointmentStatus.BOOKED) {
      console.warn(
        `approveAppointment: appointment ${appointmentId} has status ${appointment.status} (expected BOOKED). Proceeding with approval to ensure invoice creation.`
      );
    }

    // Update appointment
    appointment.status = AppointmentStatus.DOCTOR_APPROVED;
    appointment.doctorDecision = "approved";
    appointment.doctorNotes = notes;
    appointment.consultationFee = consultationFee || 0;
    appointment.depositAmount = depositAmount || 0;
    appointment.insuranceCoverage = insuranceCoverage || 0;
    await appointment.save();

    // After saving appointment, attempt to create a consultation invoice (idempotent)
    try {
      // If appointment is already paid (captured) or authorized, do not create
      // a new consultation invoice or set the appointment back to AWAIT_PAYMENT.
      // This prevents asking patients who already completed payment to pay
      // again when the doctor re-approves or reconfirms after a reschedule.
      if (
        appointment.paymentStatus === PaymentStatus.CAPTURED ||
        appointment.paymentStatus === PaymentStatus.AUTHORIZED
      ) {
        // already paid/authorized -> skip invoice creation
      } else {
        const existing = await Invoice.findOne({
          appointmentId,
          type: "consultation",
          status: "pending",
        });
        if (!existing) {
          // If clinic/doctor provided explicit fee, use it; otherwise try compute
          let createdInvoice = null as any;
          const fee = Number(consultationFee ?? 0);
          const deposit = Number(depositAmount ?? 0);
          if (fee > 0 || deposit > 0) {
            createdInvoice = await Invoice.create({
              appointmentId,
              type: "consultation",
              items: [
                ...(fee > 0
                  ? [
                      {
                        type: "consultation_fee",
                        description: "Phí khám cơ bản",
                        amount: fee,
                        insuranceAmount: 0,
                        patientAmount: fee,
                      },
                    ]
                  : []),
                ...(deposit > 0
                  ? [
                      {
                        type: "deposit",
                        description: "Đặt cọc giữ chỗ",
                        amount: deposit,
                        insuranceAmount: 0,
                        patientAmount: deposit,
                      },
                    ]
                  : []),
              ],
              subtotal: (fee || 0) + (deposit || 0),
              insuranceCoverage: 0,
              patientAmount: (fee || 0) + (deposit || 0),
              dueDate: new Date(Date.now() + PAYMENT_HOLD_MS),
            });
          } else {
            // attempt compute from service
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
            const durationMin = 45;
            const startAt = new Date(
              `${appointment.appointmentDate}T${appointment.appointmentTime}:00`
            ).toISOString();
            const resolveDoctorIdLocal = (d: any): string | undefined => {
              if (!d) return undefined;
              if (typeof d === "string")
                return /^[0-9a-fA-F]{24}$/.test(d) ? d : undefined;
              if (typeof d === "object") {
                if ((d as any)?._id) return String((d as any)._id);
                try {
                  const s = String(d);
                  if (/^[0-9a-fA-F]{24}$/.test(s)) return s;
                } catch {}
              }
              return undefined;
            };

            const computed = await computeConsultPrice({
              serviceCode,
              doctorId:
                resolveDoctorIdLocal(doctorId) ||
                resolveDoctorIdLocal(appointment.doctorId),
              durationMin,
              startAt,
              bhytEligible: (appointment.insuranceCoverage || 0) > 0,
              copayRate: (appointment.insuranceCoverage || 0) / 100,
            });
            const mapped = computed.items.map((it: any) => ({
              type:
                it.component === "facility"
                  ? "consultation_fee"
                  : "additional_services",
              description: it.description,
              amount: it.amount,
              insuranceAmount: it.insuranceAmount || 0,
              patientAmount: it.patientAmount || 0,
            }));
            createdInvoice = await Invoice.create({
              appointmentId,
              type: "consultation",
              items: mapped,
              subtotal: computed.totals.total,
              insuranceCoverage: computed.totals.bhyt,
              patientAmount: computed.totals.patient,
              dueDate: new Date(Date.now() + PAYMENT_HOLD_MS),
            });
          }
          if (createdInvoice) {
            // update appointment payment totals
            appointment.status = AppointmentStatus.AWAIT_PAYMENT;
            appointment.totalAmount = createdInvoice.subtotal;
            appointment.patientAmount = createdInvoice.patientAmount;
            appointment.paymentStatus = PaymentStatus.PENDING;
            await appointment.save();
          }
        }
      }
    } catch (err) {
      console.error("Auto-create invoice failed:", err);
      // don't block the approve flow on invoice errors
    }

    // Notify patient about the doctor's approval and any invoice created
    try {
      await createNotification({
        userId: String(appointment.patientId),
        type: "appointment",
        title: "Bác sĩ đã xác nhận lịch hẹn",
        body: `Lịch hẹn của bạn đã được bác sĩ xác nhận. Trạng thái: ${appointment.status}`,
      } as any);
    } catch (err) {
      console.error("Notify patient about approval failed:", err);
    }

    res.json({
      message: "Đã chấp nhận lịch hẹn",
      appointment,
      nextStep: "Tạo hóa đơn tạm ứng để bệnh nhân thanh toán",
    });
  } catch (error) {
    const err = error as Error;
    console.error("Error approving appointment:", err);
    res
      .status(500)
      .json({ message: "Lỗi chấp nhận lịch hẹn", error: err.message });
  }
};

// Doctor requests reschedule
export const requestReschedule = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const { doctorId, newScheduleId, proposedScheduleId, reason, notes } =
      req.body;

    // Allow doctor to request reschedule for booked/confirmed/paid/await_payment
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId,
      status: {
        $in: [
          AppointmentStatus.BOOKED,
          AppointmentStatus.CONFIRMED,
          AppointmentStatus.PAID,
          AppointmentStatus.AWAIT_PAYMENT,
        ],
      },
    });

    if (!appointment) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lịch hẹn chờ xác nhận" });
    }

    // Check if new schedule exists and is available
    const scheduleIdToCheck = newScheduleId || proposedScheduleId;
    const newSchedule = await DoctorSchedule.findOne({
      _id: scheduleIdToCheck,
      doctorId,
      status: "accepted",
      isBooked: false,
    });

    if (!newSchedule) {
      return res
        .status(400)
        .json({ message: "Khung giờ mới không hợp lệ hoặc đã được đặt" });
    }

    // Update appointment
    appointment.status = AppointmentStatus.DOCTOR_RESCHEDULE;
    appointment.doctorDecision = "reschedule";
    appointment.rescheduleReason = reason;
    appointment.doctorNotes = notes;
    // Use the validated schedule id (could be passed as newScheduleId or proposedScheduleId)
    appointment.newScheduleId = scheduleIdToCheck;
    await appointment.save();

    // Notify patient about reschedule request
    try {
      await createNotification({
        userId: String(appointment.patientId),
        type: "appointment",
        title: "Bác sĩ đề nghị dời lịch",
        body: `Bác sĩ đề nghị dời lịch: ${reason || ""}`,
      } as any);
    } catch (err) {
      console.error("Notify patient about reschedule failed:", err);
    }

    res.json({
      message: "Đã yêu cầu dời lịch",
      appointment,
      newSchedule,
      nextStep: "Chờ bệnh nhân xác nhận lịch mới",
    });
  } catch (error) {
    const err = error as Error;
    console.error("Error requesting reschedule:", err);
    res
      .status(500)
      .json({ message: "Lỗi yêu cầu dời lịch", error: err.message });
  }
};

// Doctor rejects appointment
export const rejectAppointment = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const { doctorId, reason, notes } = req.body;

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId,
      status: AppointmentStatus.BOOKED,
    });

    if (!appointment) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lịch hẹn chờ xác nhận" });
    }

    // Update appointment
    appointment.status = AppointmentStatus.DOCTOR_REJECTED;
    appointment.doctorDecision = "rejected";
    appointment.rejectionReason = reason;
    appointment.doctorNotes = notes;
    appointment.cancelledAt = new Date();
    appointment.cancelledBy = "doctor";
    appointment.cancellationReason = reason;
    await appointment.save();

    // Free up the schedule
    const schedule = await DoctorSchedule.findById(appointment.scheduleId);
    if (schedule) {
      schedule.isBooked = false;
      await schedule.save();
    }

    res.json({
      message: "Đã từ chối lịch hẹn",
      appointment,
      nextStep: "Nếu đã thanh toán, cần hoàn tiền cho bệnh nhân",
    });
    // Notify patient about rejection
    try {
      await createNotification({
        userId: String(appointment.patientId),
        type: "appointment",
        title: "Lịch hẹn bị từ chối",
        body: `Lịch hẹn của bạn đã bị bác sĩ từ chối. Lý do: ${reason || ""}`,
      } as any);
    } catch (err) {
      console.error("Notify patient about rejection failed:", err);
    }
  } catch (error) {
    const err = error as Error;
    console.error("Error rejecting appointment:", err);
    res
      .status(500)
      .json({ message: "Lỗi từ chối lịch hẹn", error: err.message });
  }
};

// Patient accepts reschedule
export const acceptReschedule = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const { patientId } = req.body;

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patientId,
      status: AppointmentStatus.DOCTOR_RESCHEDULE,
    });

    if (!appointment) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lịch hẹn chờ dời" });
    }

    if (!appointment.newScheduleId) {
      return res.status(400).json({ message: "Không có lịch mới để chuyển" });
    }

    // Free up old schedule
    const oldSchedule = await DoctorSchedule.findById(appointment.scheduleId);
    if (oldSchedule) {
      oldSchedule.isBooked = false;
      await oldSchedule.save();
    }

    // Book new schedule
    const newSchedule = await DoctorSchedule.findById(
      appointment.newScheduleId
    );
    if (newSchedule) {
      newSchedule.isBooked = true;
      await newSchedule.save();
    }

    // Update appointment: switch to new schedule and set status.
    appointment.scheduleId = appointment.newScheduleId;
    appointment.appointmentDate =
      newSchedule?.date || appointment.appointmentDate;
    appointment.appointmentTime =
      newSchedule?.startTime || appointment.appointmentTime;
    // If patient already paid or authorized the payment, keep the appointment
    // confirmed so they are not asked to pay again. Otherwise revert to BOOKED
    // so the doctor can re-approve and (if needed) an invoice can be created.
    if (
      appointment.paymentStatus === PaymentStatus.CAPTURED ||
      appointment.paymentStatus === PaymentStatus.AUTHORIZED
    ) {
      appointment.status = AppointmentStatus.CONFIRMED;
      appointment.confirmedAt = appointment.confirmedAt || new Date();
    } else {
      appointment.status = AppointmentStatus.BOOKED; // Back to booked, waiting for approval
    }
    appointment.doctorDecision = undefined;
    appointment.rescheduleReason = undefined;
    appointment.newScheduleId = undefined;
    await appointment.save();

    res.json({
      message: "Đã chấp nhận lịch mới",
      appointment,
      nextStep: "Chờ bác sĩ xác nhận lại lịch mới",
    });
    // Notify doctor that patient accepted reschedule (could notify both)
    try {
      await createNotification({
        userId: String(appointment.doctorId),
        type: "appointment",
        title: "Bệnh nhân đã chấp nhận dời lịch",
        body: `Bệnh nhân đã chấp nhận lịch mới`,
      } as any);
    } catch (err) {
      console.error("Notify doctor about reschedule acceptance failed:", err);
    }
  } catch (error) {
    const err = error as Error;
    console.error("Error accepting reschedule:", err);
    res
      .status(500)
      .json({ message: "Lỗi chấp nhận lịch mới", error: err.message });
  }
};

// Start consultation
export const startConsultation = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const { doctorId } = req.body;

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId,
      status: AppointmentStatus.CONFIRMED,
    }).populate("patientId");

    if (!appointment) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lịch hẹn đã xác nhận" });
    }

    // Update appointment
    appointment.status = AppointmentStatus.IN_CONSULT;
    appointment.startedAt = new Date();
    await appointment.save();

    // Create Encounter record linked to this appointment
    let encounter = null;
    try {
      encounter = await Encounter.create({
        appointmentId: appointment._id,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        status: "in_consult",
        startedAt: new Date(),
      });
      // attach encounter id to response for client convenience
      (appointment as any)._encounter = encounter;
    } catch (err) {
      console.error(
        "Failed to create Encounter for appointment",
        appointmentId,
        err
      );
      // don't fail the startConsultation flow if encounter creation fails
    }

    // Automatically create medical record when starting consultation
    let medicalRecord = null;
    try {
      // Check if medical record already exists for this appointment
      const existingRecord = await MedicalRecord.findOne({ appointmentId });

      if (!existingRecord) {
        const patient = appointment.patientId as any;

        medicalRecord = await MedicalRecord.create({
          appointmentId: appointment._id,
          patient: patient._id,
          doctor: doctorId,
          appointmentCode: `APT-${Date.now()}`,
          consultationType: appointment.mode || "offline",
          patientInfo: {
            fullName: patient.name || patient.fullName || "",
            birthYear: patient.birthYear,
            gender: patient.gender,
            insuranceNumber: patient.insuranceNumber,
            emergencyContactName: patient.emergencyContactName,
            emergencyContactPhone: patient.emergencyContactPhone,
          },
          reasonForVisit: "Khám tổng quát",
          chiefComplaint: appointment.symptoms || "Chưa có triệu chứng cụ thể",
          preliminaryDiagnosis: "Chưa có chẩn đoán sơ bộ",
          diagnosis: "Chưa có chẩn đoán cuối cùng",
          treatment: "Chưa có phương pháp điều trị",
          status: "in_progress",
        });

        console.log(
          `Created medical record ${medicalRecord._id} for appointment ${appointmentId}`
        );
      } else {
        medicalRecord = existingRecord;
        // Update status to in_progress if it was draft
        if (existingRecord.status === "draft") {
          existingRecord.status = "in_progress";
          await existingRecord.save();
        }
        console.log(
          `Using existing medical record ${existingRecord._id} for appointment ${appointmentId}`
        );
      }
    } catch (err) {
      console.error(
        "Failed to create/update medical record for appointment",
        appointmentId,
        err
      );
      // don't fail the startConsultation flow if medical record creation fails
    }

    res.json({
      message: "Đã bắt đầu khám",
      appointment,
      medicalRecord: medicalRecord
        ? {
            id: medicalRecord._id,
            status: medicalRecord.status,
          }
        : null,
    });

    try {
      await createNotification({
        userId: String(appointment.patientId),
        type: "appointment",
        title: "Bắt đầu khám",
        body: `Bác sĩ đã bắt đầu buổi khám của bạn`,
      } as any);
    } catch (err) {
      console.error("Notify patient about startConsultation failed:", err);
    }
  } catch (error) {
    const err = error as Error;
    console.error("Error starting consultation:", err);
    res.status(500).json({ message: "Lỗi bắt đầu khám", error: err.message });
  }
};

// Complete consultation
export const completeConsultation = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const { doctorId, diagnosis, prescription, additionalServices } = req.body;

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId,
      status: AppointmentStatus.IN_CONSULT,
    });

    if (!appointment) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lịch hẹn đang khám" });
    }

    // Update appointment
    appointment.diagnosis = diagnosis;
    appointment.prescription = prescription;
    appointment.additionalServices = additionalServices || [];
    appointment.status = AppointmentStatus.PRESCRIPTION_ISSUED;
    await appointment.save();

    res.json({
      message: "Đã hoàn tất khám",
      appointment,
      nextStep: "Tạo hóa đơn quyết toán cho các dịch vụ bổ sung",
    });
    try {
      await createNotification({
        userId: String(appointment.patientId),
        type: "appointment",
        title: "Khám hoàn tất",
        body: `Buổi khám đã hoàn tất. Vui lòng xem kết quả và hoá đơn.`,
      } as any);
    } catch (err) {
      console.error("Notify patient about completeConsultation failed:", err);
    }
  } catch (error) {
    const err = error as Error;
    console.error("Error completing consultation:", err);
    res.status(500).json({ message: "Lỗi hoàn tất khám", error: err.message });
  }
};
