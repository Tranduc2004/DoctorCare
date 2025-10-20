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
exports.syncFromMedicalRecord = exports.upsertInsurance = exports.upsertProfile = exports.getProfile = void 0;
const PatientProfile_1 = __importDefault(require("../models/PatientProfile"));
const Insurance_1 = __importDefault(require("../models/Insurance"));
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId } = req.query;
        if (!patientId)
            return res.status(400).json({ message: "Thiếu patientId" });
        const profile = yield PatientProfile_1.default.findOne({ patientId }).lean();
        const insurance = yield Insurance_1.default.findOne({ patientId }).lean();
        res.json({ profile, insurance });
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy hồ sơ", error });
    }
});
exports.getProfile = getProfile;
const upsertProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId, profile } = req.body;
        if (!patientId)
            return res.status(400).json({ message: "Thiếu patientId" });
        const sanitized = Object.assign({}, (profile || {}));
        // Normalize numeric fields
        if (sanitized.heightCm != null)
            sanitized.heightCm = Number(sanitized.heightCm);
        if (sanitized.weightKg != null)
            sanitized.weightKg = Number(sanitized.weightKg);
        const doc = yield PatientProfile_1.default.findOneAndUpdate({ patientId }, { $set: Object.assign(Object.assign({}, sanitized), { patientId }) }, { new: true, upsert: true });
        res.json(doc);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lưu hồ sơ", error });
    }
});
exports.upsertProfile = upsertProfile;
const upsertInsurance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId, insurance } = req.body;
        if (!patientId)
            return res.status(400).json({ message: "Thiếu patientId" });
        console.log("Saving insurance data:", insurance);
        console.log("Image URL:", insurance === null || insurance === void 0 ? void 0 : insurance.imageUrl);
        // Always set verification status to pending when patient submits/updates
        const insuranceData = Object.assign(Object.assign({}, insurance), { patientId, verificationStatus: "pending", submittedAt: new Date(), submittedBy: patientId });
        const doc = yield Insurance_1.default.findOneAndUpdate({ patientId }, { $set: insuranceData }, { new: true, upsert: true });
        console.log("Saved insurance doc:", doc);
        res.json(Object.assign(Object.assign({}, doc), { message: "Thông tin BHYT đã được gửi chờ duyệt. Admin sẽ xem xét và phê duyệt trong thời gian sớm nhất." }));
    }
    catch (error) {
        console.error("Error saving insurance:", error);
        res.status(500).json({ message: "Lỗi lưu BHYT", error });
    }
});
exports.upsertInsurance = upsertInsurance;
// Sync patient profile data from medical record
const syncFromMedicalRecord = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    try {
        const { patientId, medicalRecordData, doctorId } = req.body;
        if (!patientId)
            return res.status(400).json({ message: "Thiếu patientId" });
        if (!medicalRecordData)
            return res.status(400).json({ message: "Thiếu dữ liệu medical record" });
        if (!doctorId)
            return res.status(400).json({ message: "Thiếu doctorId" });
        // Extract relevant fields from medical record to sync with patient profile
        const profileUpdateData = {};
        // Basic administrative info
        if ((_a = medicalRecordData.administrativeSnapshot) === null || _a === void 0 ? void 0 : _a.fullName) {
            profileUpdateData.fullName = medicalRecordData.administrativeSnapshot.fullName;
        }
        if ((_b = medicalRecordData.administrativeSnapshot) === null || _b === void 0 ? void 0 : _b.birthYear) {
            // Convert birth year to DOB format (YYYY-01-01)
            profileUpdateData.dob = `${medicalRecordData.administrativeSnapshot.birthYear}-01-01`;
        }
        if ((_c = medicalRecordData.administrativeSnapshot) === null || _c === void 0 ? void 0 : _c.gender) {
            profileUpdateData.gender = medicalRecordData.administrativeSnapshot.gender;
        }
        if ((_d = medicalRecordData.administrativeSnapshot) === null || _d === void 0 ? void 0 : _d.phone) {
            profileUpdateData.phone = medicalRecordData.administrativeSnapshot.phone;
        }
        // Emergency contact
        if ((_e = medicalRecordData.administrativeSnapshot) === null || _e === void 0 ? void 0 : _e.emergencyContact) {
            const emergencyContact = medicalRecordData.administrativeSnapshot.emergencyContact;
            if (emergencyContact.name) {
                profileUpdateData.emergencyContactName = emergencyContact.name;
            }
            if (emergencyContact.phone) {
                profileUpdateData.emergencyContactPhone = emergencyContact.phone;
            }
            if (emergencyContact.relation) {
                profileUpdateData.emergencyContactRelation = emergencyContact.relation;
            }
        }
        // Medical information from quick screening
        if ((_f = medicalRecordData.quickScreening) === null || _f === void 0 ? void 0 : _f.allergies) {
            profileUpdateData.allergies = medicalRecordData.quickScreening.allergies;
        }
        if ((_g = medicalRecordData.quickScreening) === null || _g === void 0 ? void 0 : _g.currentMedications) {
            profileUpdateData.medications = medicalRecordData.quickScreening.currentMedications;
        }
        // Vitals - update height and weight if provided
        if ((_j = (_h = medicalRecordData.quickScreening) === null || _h === void 0 ? void 0 : _h.vitals) === null || _j === void 0 ? void 0 : _j.height) {
            profileUpdateData.heightCm = Number(medicalRecordData.quickScreening.vitals.height);
        }
        if ((_l = (_k = medicalRecordData.quickScreening) === null || _k === void 0 ? void 0 : _k.vitals) === null || _l === void 0 ? void 0 : _l.weight) {
            profileUpdateData.weightKg = Number(medicalRecordData.quickScreening.vitals.weight);
        }
        // Add audit log entry
        const auditEntry = {
            action: "sync_from_medical_record",
            timestamp: new Date(),
            userId: doctorId,
            details: "Đồng bộ thông tin từ hồ sơ khám bệnh"
        };
        // Update patient profile
        const updatedProfile = yield PatientProfile_1.default.findOneAndUpdate({ patientId }, {
            $set: Object.assign(Object.assign({}, profileUpdateData), { lastEditedBy: doctorId }),
            $push: { auditLog: auditEntry }
        }, { new: true, upsert: true });
        res.json({
            success: true,
            message: "Đã đồng bộ thông tin bệnh nhân từ hồ sơ khám bệnh",
            updatedProfile,
            syncedFields: Object.keys(profileUpdateData)
        });
    }
    catch (error) {
        console.error("Error syncing profile from medical record:", error);
        res.status(500).json({ message: "Lỗi đồng bộ hồ sơ", error });
    }
});
exports.syncFromMedicalRecord = syncFromMedicalRecord;
