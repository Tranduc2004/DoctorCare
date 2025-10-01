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
exports.updateInsuranceExpiry = exports.getVerificationHistory = exports.verifyInsurance = exports.getInsuranceVerifications = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Insurance_1 = __importDefault(require("../../patient/models/Insurance"));
const PatientProfile_1 = __importDefault(require("../../patient/models/PatientProfile"));
const getInsuranceVerifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status = "pending", page = 1, limit = 10, search, } = req.query;
        const query = {};
        // Filter by verification status
        if (status !== "all") {
            query.verificationStatus = status;
        }
        // Search by policy number or patient name
        if (search) {
            query.$or = [
                { policyNumber: new RegExp(search, "i") },
                { "patientProfile.fullName": new RegExp(search, "i") },
            ];
        }
        const [insurances, total] = yield Promise.all([
            Insurance_1.default.find(query)
                .populate("patientId", "name email phone")
                .skip((+page - 1) * +limit)
                .limit(+limit)
                .sort({ submittedAt: -1 })
                .lean(),
            Insurance_1.default.countDocuments(query),
        ]);
        // Get patient profiles for more details
        const patientIds = insurances.map((ins) => ins.patientId);
        const profiles = yield PatientProfile_1.default.find({
            patientId: { $in: patientIds },
        }).lean();
        const profileMap = profiles.reduce((acc, profile) => {
            acc[profile.patientId.toString()] = profile;
            return acc;
        }, {});
        // Combine insurance data with profile data
        const enrichedInsurances = insurances.map((insurance) => {
            const patientData = insurance.patientId; // Cast to any since we populated it
            const profileData = profileMap[insurance.patientId.toString()];
            console.log("Insurance data:", insurance);
            console.log("Image URL:", insurance.imageUrl);
            return Object.assign(Object.assign({}, insurance), { patient: {
                    _id: insurance.patientId,
                    name: (patientData === null || patientData === void 0 ? void 0 : patientData.name) || (profileData === null || profileData === void 0 ? void 0 : profileData.fullName) || "N/A",
                    email: (patientData === null || patientData === void 0 ? void 0 : patientData.email) || (profileData === null || profileData === void 0 ? void 0 : profileData.email) || "N/A",
                    phone: (patientData === null || patientData === void 0 ? void 0 : patientData.phone) || (profileData === null || profileData === void 0 ? void 0 : profileData.phone) || "N/A",
                } });
        });
        res.json({
            insurances: enrichedInsurances,
            total,
            pages: Math.ceil(total / +limit),
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Lỗi khi lấy danh sách yêu cầu xác thực BHYT",
            error,
        });
    }
});
exports.getInsuranceVerifications = getInsuranceVerifications;
const verifyInsurance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { insuranceId } = req.params;
        const { verificationStatus, rejectionReason } = req.body;
        const adminId = req.adminId;
        console.log("Verify insurance request:", {
            insuranceId,
            verificationStatus,
            rejectionReason,
            adminId,
        });
        if (!adminId) {
            return res.status(401).json({ message: "Admin ID không tồn tại" });
        }
        // Convert string to ObjectId
        const adminObjectId = new mongoose_1.default.Types.ObjectId(adminId);
        const insurance = yield Insurance_1.default.findById(insuranceId);
        if (!insurance) {
            return res.status(404).json({ message: "Không tìm thấy thông tin BHYT" });
        }
        console.log("Found insurance:", insurance);
        // Update verification status
        insurance.verificationStatus =
            verificationStatus === "approved" ? "verified" : "rejected";
        insurance.verifiedAt = new Date();
        insurance.verifiedBy = adminObjectId;
        insurance.verificationNotes =
            verificationStatus === "approved"
                ? "Đã được admin phê duyệt"
                : rejectionReason;
        if (verificationStatus === "rejected") {
            insurance.rejectionReason = rejectionReason;
        }
        // Add to audit log
        insurance.auditLog = insurance.auditLog || [];
        insurance.auditLog.push({
            action: `insurance_${verificationStatus}`,
            timestamp: new Date(),
            userId: adminObjectId,
            details: verificationStatus === "approved"
                ? "Đã được admin phê duyệt"
                : rejectionReason,
        });
        yield insurance.save();
        console.log("Insurance saved successfully");
        // If verifying, also update patient profile status
        if (verificationStatus === "approved") {
            try {
                yield PatientProfile_1.default.findOneAndUpdate({ patientId: insurance.patientId }, {
                    $set: {
                        profileStatus: "verified",
                        verifiedAt: new Date(),
                        verifiedBy: adminObjectId,
                    },
                    $push: {
                        auditLog: {
                            action: "profile_verified",
                            timestamp: new Date(),
                            userId: adminObjectId,
                            details: "Xác thực qua BHYT",
                        },
                    },
                });
                console.log("Patient profile updated successfully");
            }
            catch (profileError) {
                console.error("Error updating patient profile:", profileError);
                // Don't fail the whole operation if profile update fails
            }
        }
        res.json(Object.assign(Object.assign({}, insurance), { message: verificationStatus === "approved"
                ? "BHYT đã được phê duyệt thành công"
                : "BHYT đã bị từ chối" }));
    }
    catch (error) {
        console.error("Error in verifyInsurance:", error);
        res.status(500).json({
            message: "Lỗi khi xác thực BHYT",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.verifyInsurance = verifyInsurance;
// Get verification history for an insurance record
const getVerificationHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { insuranceId } = req.params;
        const insurance = yield Insurance_1.default.findById(insuranceId)
            .populate("verifiedBy", "username")
            .populate("submittedBy", "name email")
            .populate("lastEditedBy", "name email")
            .populate("auditLog.userId", "name email username")
            .lean();
        if (!insurance) {
            return res.status(404).json({ message: "Không tìm thấy thông tin BHYT" });
        }
        res.json(insurance);
    }
    catch (error) {
        res.status(500).json({
            message: "Lỗi khi lấy lịch sử xác thực",
            error,
        });
    }
});
exports.getVerificationHistory = getVerificationHistory;
// Update insurance verification expiry
const updateInsuranceExpiry = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { insuranceId } = req.params;
        const adminId = req.adminId;
        const { validTo, notes } = req.body;
        if (!adminId) {
            return res.status(401).json({ message: "Admin ID không tồn tại" });
        }
        const adminObjectId = new mongoose_1.default.Types.ObjectId(adminId);
        const insurance = yield Insurance_1.default.findById(insuranceId);
        if (!insurance) {
            return res.status(404).json({ message: "Không tìm thấy thông tin BHYT" });
        }
        insurance.validTo = validTo;
        insurance.lastEditedBy = adminObjectId;
        insurance.verificationNotes = notes;
        // Add to audit log
        insurance.auditLog = insurance.auditLog || [];
        insurance.auditLog.push({
            action: "update_expiry",
            timestamp: new Date(),
            userId: adminObjectId,
            details: `Cập nhật hạn BHYT: ${validTo}${notes ? ` - ${notes}` : ""}`,
        });
        // Check if insurance has expired
        const today = new Date();
        const expiryDate = new Date(validTo);
        if (expiryDate < today) {
            insurance.verificationStatus = "expired";
        }
        yield insurance.save();
        res.json(insurance);
    }
    catch (error) {
        res.status(500).json({
            message: "Lỗi khi cập nhật hạn BHYT",
            error,
        });
    }
});
exports.updateInsuranceExpiry = updateInsuranceExpiry;
