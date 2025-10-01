import { isAfterHours } from "../../../shared/utils/time";
import Service from "../../admin/models/Service";
import DoctorTariff from "../../admin/models/DoctorTariff";
import Doctor from "../../doctor/models/Doctor";

type PricingCtx = {
  serviceCode: string; // assume serviceCode maps to Service.name or separate code
  doctorId?: string;
  durationMin: number;
  startAt: string; // ISO date
  bhytEligible: boolean;
  copayRate?: number; // 0..1 (patient share of base)
};

function clamp(v: number, min?: number, max?: number) {
  if (typeof min === "number") v = Math.max(v, min);
  if (typeof max === "number") v = Math.min(v, max);
  return Math.round(v);
}

export async function computeConsultPrice(ctx: PricingCtx) {
  // 1. find base price from Service model (by name/serviceCode)
  let service = null as any;
  if (ctx.serviceCode) {
    service = await Service.findOne({ name: ctx.serviceCode });
  }
  // fallback to any active service if specific one not found
  if (!service) {
    service = await Service.findOne({ isActive: true });
  }
  // final fallback: synthesize minimal service object
  if (!service) {
    service = { name: ctx.serviceCode || "Dịch vụ khám", price: 0 };
  }
  const base = Math.round(service.price || 0);

  // 2. find tariff: first by doctorId + serviceCode, then by specialty (not implemented), then fallback none
  let tariff = null;
  if (ctx.doctorId) {
    tariff = await DoctorTariff.findOne({
      doctorId: ctx.doctorId,
      serviceCode: ctx.serviceCode,
      status: "active",
    });
  }

  // if no tariff for doctor, try fallback: any active tariff for serviceCode
  if (!tariff) {
    tariff = await DoctorTariff.findOne({
      serviceCode: ctx.serviceCode,
      status: "active",
    });
  }

  // If still no tariff, check doctor's own consultationFee (simple flat fallback)
  let doctorRecord: any = null;
  if (!tariff && ctx.doctorId) {
    doctorRecord = await Doctor.findById(ctx.doctorId).lean();
  }

  // 3. compute doctor fee
  let doctorFee = 0;
  let slots = 0;
  if (tariff) {
    const t = tariff as any;
    if (t.feeType === "flat") {
      doctorFee = Math.round(t.baseFee || 0);
    } else {
      slots = Math.max(1, Math.ceil(ctx.durationMin / 15));
      doctorFee = Math.round(slots * (t.unitFee || 0));
    }

    if (isAfterHours(new Date(ctx.startAt))) {
      doctorFee = Math.round(doctorFee * (t.afterHoursMultiplier || 1));
    }

    doctorFee = clamp(doctorFee, t.minFee, t.maxFee);
  } else if (doctorRecord && typeof doctorRecord.consultationFee === "number") {
    // simple fallback: doctor's consultationFee treated as flat
    doctorFee = Math.round(doctorRecord.consultationFee || 0);
  }

  // 4. BHYT split — interpret copayRate as patient share on base (0..1)
  const copay = ctx.copayRate ?? 0; // default 0 => BHYT covers base fully? adapt to your policy
  const bhytCover = ctx.bhytEligible ? Math.round(base * (1 - copay)) : 0;
  const patientOnBase = base - bhytCover;

  const items = [
    {
      component: "facility",
      description: service.name,
      amount: base,
      payer: bhytCover > 0 ? "bhyt" : "patient",
      insuranceAmount: bhytCover,
      patientAmount: patientOnBase,
    },
    {
      component: "doctor_fee",
      description: "Phí bác sĩ",
      amount: doctorFee,
      payer: "patient",
      insuranceAmount: 0,
      patientAmount: doctorFee,
    },
  ];

  const totals = {
    total: base + doctorFee,
    patient: patientOnBase + doctorFee,
    bhyt: bhytCover,
  };

  return {
    items,
    totals,
    meta: {
      basePrice: base,
      doctorFee,
      slots,
      tariffId: tariff?._id,
    },
  };
}
