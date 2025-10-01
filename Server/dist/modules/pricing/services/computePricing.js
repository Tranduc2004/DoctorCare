"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeConsultPrice = computeConsultPrice;
const time_1 = require("../../../shared/utils/time");
const Service_1 = __importDefault(require("../../admin/models/Service"));
const DoctorTariff_1 = __importDefault(require("../../admin/models/DoctorTariff"));
const Doctor_1 = __importDefault(require("../../doctor/models/Doctor"));
function clamp(v, min, max) {
    if (typeof min === "number")
        v = Math.max(v, min);
    if (typeof max === "number")
        v = Math.min(v, max);
    return Math.round(v);
}
function computeConsultPrice(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        // 1. find base price from Service model (by name/serviceCode)
        let service = null;
        if (ctx.serviceCode) {
            service = yield Service_1.default.findOne({ name: ctx.serviceCode });
        }
        // fallback to any active service if specific one not found
        if (!service) {
            service = yield Service_1.default.findOne({ isActive: true });
        }
        // final fallback: synthesize minimal service object
        if (!service) {
            service = { name: ctx.serviceCode || "Dịch vụ khám", price: 0 };
        }
        const base = Math.round(service.price || 0);
        // 2. find tariff: first by doctorId + serviceCode, then by specialty (not implemented), then fallback none
        let tariff = null;
        if (ctx.doctorId) {
            tariff = yield DoctorTariff_1.default.findOne({
                doctorId: ctx.doctorId,
                serviceCode: ctx.serviceCode,
                status: "active",
            });
        }
        // if no tariff for doctor, try fallback: any active tariff for serviceCode
        if (!tariff) {
            tariff = yield DoctorTariff_1.default.findOne({
                serviceCode: ctx.serviceCode,
                status: "active",
            });
        }
        // If still no tariff, check doctor's own consultationFee (simple flat fallback)
        let doctorRecord = null;
        if (!tariff && ctx.doctorId) {
            doctorRecord = yield Doctor_1.default.findById(ctx.doctorId).lean();
        }
        // 3. compute doctor fee
        let doctorFee = 0;
        let slots = 0;
        if (tariff) {
            const t = tariff;
            if (t.feeType === "flat") {
                doctorFee = Math.round(t.baseFee || 0);
            }
            else {
                slots = Math.max(1, Math.ceil(ctx.durationMin / 15));
                doctorFee = Math.round(slots * (t.unitFee || 0));
            }
            if ((0, time_1.isAfterHours)(new Date(ctx.startAt))) {
                doctorFee = Math.round(doctorFee * (t.afterHoursMultiplier || 1));
            }
            doctorFee = clamp(doctorFee, t.minFee, t.maxFee);
        }
        else if (doctorRecord && typeof doctorRecord.consultationFee === "number") {
            // simple fallback: doctor's consultationFee treated as flat
            doctorFee = Math.round(doctorRecord.consultationFee || 0);
        }
        // 4. BHYT split — interpret copayRate as patient share on base (0..1)
        const copay = (_a = ctx.copayRate) !== null && _a !== void 0 ? _a : 0; // default 0 => BHYT covers base fully? adapt to your policy
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
                tariffId: tariff === null || tariff === void 0 ? void 0 : tariff._id,
            },
        };
    });
}
