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
exports.getPrescriptionsByStatus = exports.getPrescriptionsByDateRange = exports.searchPrescriptions = exports.getPrescriptionDetail = exports.getPatientPrescriptions = void 0;
const MedicalRecord_1 = __importDefault(require("../models/MedicalRecord"));
// Patient: Lấy danh sách đơn thuốc từ bệnh án
const getPatientPrescriptions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId, page = 1, limit = 10, } = req.query;
        if (!patientId) {
            res.status(400).json({ message: "Thiếu patientId" });
            return;
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Lấy các bệnh án có đơn thuốc
        const records = yield MedicalRecord_1.default.find({
            patient: patientId,
            status: "completed",
            $or: [
                { "prescription.medications": { $exists: true, $ne: [] } },
                { "treatment.medicationsList": { $exists: true, $ne: [] } },
            ],
        })
            .populate({
            path: "doctor",
            select: "name specialty workplace phone",
            populate: {
                path: "specialty",
                select: "name",
            },
        })
            .populate("patient", "name email phone")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean();
        // Transform data to prescription format
        const prescriptions = records.map((record) => {
            var _a, _b, _c, _d, _e;
            // Determine medications source
            let medications = [];
            if (((_b = (_a = record.prescription) === null || _a === void 0 ? void 0 : _a.medications) === null || _b === void 0 ? void 0 : _b.length) > 0) {
                medications = record.prescription.medications;
            }
            else if (typeof record.treatment === "object" &&
                ((_d = (_c = record.treatment) === null || _c === void 0 ? void 0 : _c.medicationsList) === null || _d === void 0 ? void 0 : _d.length) > 0) {
                // Convert medicationsList format to prescription format
                medications = record.treatment.medicationsList.map((med) => {
                    var _a;
                    return ({
                        name: med.drugName,
                        strength: med.strength,
                        form: med.form,
                        dosage: med.dosage,
                        frequency: ((_a = med.frequency) === null || _a === void 0 ? void 0 : _a.toString()) || "1",
                        duration: med.duration,
                        quantity: med.quantity,
                        instructions: med.instructions,
                    });
                });
            }
            return {
                _id: `${record._id}_prescription`,
                recordId: record._id,
                patientId: record.patient._id,
                doctorId: record.doctor._id,
                appointmentId: record.appointment,
                medications,
                notes: ((_e = record.prescription) === null || _e === void 0 ? void 0 : _e.notes) || "",
                prescriptionDate: record.prescriptionIssuedAt || record.createdAt,
                status: record.status === "completed" ? "active" : record.status,
                doctor: {
                    _id: record.doctor._id,
                    name: record.doctor.name,
                    specialty: record.doctor.specialty,
                    workplace: record.doctor.workplace,
                    phone: record.doctor.phone,
                },
                patient: record.patient,
                medicalRecord: {
                    _id: record._id,
                    diagnosis: record.diagnosis || record.preliminaryDiagnosis,
                    preliminaryDiagnosis: record.preliminaryDiagnosis,
                    consultationType: record.consultationType,
                    createdAt: record.createdAt,
                },
            };
        });
        // Count total prescriptions
        const total = yield MedicalRecord_1.default.countDocuments({
            patient: patientId,
            status: "completed",
            $or: [
                { "prescription.medications": { $exists: true, $ne: [] } },
                { "treatment.medicationsList": { $exists: true, $ne: [] } },
            ],
        });
        res.json({
            prescriptions,
            pagination: {
                current: pageNum,
                total: Math.ceil(total / limitNum),
                count: total,
                limit: limitNum,
            },
        });
    }
    catch (error) {
        console.error("Error fetching patient prescriptions:", error);
        res.status(500).json({ message: "Lỗi lấy danh sách đơn thuốc", error });
    }
});
exports.getPatientPrescriptions = getPatientPrescriptions;
// Patient: Lấy chi tiết đơn thuốc
const getPrescriptionDetail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const { prescriptionId } = req.params;
        const { patientId } = req.query;
        if (!patientId) {
            res.status(400).json({ message: "Thiếu patientId" });
            return;
        }
        // Extract record ID from prescription ID
        const recordId = prescriptionId.replace("_prescription", "");
        const record = yield MedicalRecord_1.default.findOne({
            _id: recordId,
            patient: patientId,
            status: "completed",
        })
            .populate({
            path: "doctor",
            select: "name specialty workplace phone",
            populate: {
                path: "specialty",
                select: "name",
            },
        })
            .populate("patient", "name email phone")
            .lean();
        if (!record) {
            res.status(404).json({ message: "Không tìm thấy đơn thuốc" });
            return;
        }
        // Determine medications source
        let medications = [];
        if (((_b = (_a = record.prescription) === null || _a === void 0 ? void 0 : _a.medications) === null || _b === void 0 ? void 0 : _b.length) > 0) {
            medications = record.prescription.medications;
        }
        else if (typeof record.treatment === "object" &&
            ((_d = (_c = record.treatment) === null || _c === void 0 ? void 0 : _c.medicationsList) === null || _d === void 0 ? void 0 : _d.length) > 0) {
            medications = record.treatment.medicationsList.map((med) => {
                var _a;
                return ({
                    name: med.drugName,
                    strength: med.strength,
                    form: med.form,
                    dosage: med.dosage,
                    frequency: ((_a = med.frequency) === null || _a === void 0 ? void 0 : _a.toString()) || "1",
                    duration: med.duration,
                    quantity: med.quantity,
                    instructions: med.instructions,
                });
            });
        }
        const prescription = {
            _id: prescriptionId,
            recordId: record._id,
            patientId: record.patient._id,
            doctorId: record.doctor._id,
            appointmentId: record.appointment,
            medications,
            notes: ((_e = record.prescription) === null || _e === void 0 ? void 0 : _e.notes) || "",
            prescriptionDate: record.prescriptionIssuedAt || record.createdAt,
            status: record.status === "completed"
                ? "active"
                : record.status,
            doctor: {
                _id: record.doctor._id,
                name: record.doctor.name,
                specialty: record.doctor.specialty,
                workplace: record.doctor.workplace,
                phone: record.doctor.phone,
            },
            patient: record.patient,
            medicalRecord: {
                _id: record._id,
                diagnosis: record.diagnosis || record.preliminaryDiagnosis,
                preliminaryDiagnosis: record.preliminaryDiagnosis,
                consultationType: record.consultationType,
                createdAt: record.createdAt,
            },
        };
        res.json(prescription);
    }
    catch (error) {
        console.error("Error fetching prescription detail:", error);
        res.status(500).json({ message: "Lỗi lấy chi tiết đơn thuốc", error });
    }
});
exports.getPrescriptionDetail = getPrescriptionDetail;
// Patient: Tìm kiếm đơn thuốc
const searchPrescriptions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId, query, page = 1, limit = 10, } = req.query;
        if (!patientId || !query) {
            res.status(400).json({ message: "Thiếu patientId hoặc query" });
            return;
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Search in medical records with prescriptions
        const searchFilter = {
            patient: patientId,
            status: "completed",
            $or: [
                { "prescription.medications": { $exists: true, $ne: [] } },
                { "treatment.medicationsList": { $exists: true, $ne: [] } },
            ],
            $and: [
                {
                    $or: [
                        {
                            "prescription.medications.name": { $regex: query, $options: "i" },
                        },
                        {
                            "treatment.medicationsList.drugName": {
                                $regex: query,
                                $options: "i",
                            },
                        },
                        { "doctor.name": { $regex: query, $options: "i" } },
                    ],
                },
            ],
        };
        const records = yield MedicalRecord_1.default.find(searchFilter)
            .populate({
            path: "doctor",
            select: "name specialty workplace phone",
            populate: {
                path: "specialty",
                select: "name",
            },
        })
            .populate("patient", "name email phone")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean();
        // Transform to prescription format
        const prescriptions = records.map((record) => {
            var _a, _b, _c, _d, _e;
            let medications = [];
            if (((_b = (_a = record.prescription) === null || _a === void 0 ? void 0 : _a.medications) === null || _b === void 0 ? void 0 : _b.length) > 0) {
                medications = record.prescription.medications;
            }
            else if (typeof record.treatment === "object" &&
                ((_d = (_c = record.treatment) === null || _c === void 0 ? void 0 : _c.medicationsList) === null || _d === void 0 ? void 0 : _d.length) > 0) {
                medications = record.treatment.medicationsList.map((med) => {
                    var _a;
                    return ({
                        name: med.drugName,
                        strength: med.strength,
                        form: med.form,
                        dosage: med.dosage,
                        frequency: ((_a = med.frequency) === null || _a === void 0 ? void 0 : _a.toString()) || "1",
                        duration: med.duration,
                        quantity: med.quantity,
                        instructions: med.instructions,
                    });
                });
            }
            return {
                _id: `${record._id}_prescription`,
                recordId: record._id,
                patientId: record.patient._id,
                doctorId: record.doctor._id,
                appointmentId: record.appointment,
                medications,
                notes: ((_e = record.prescription) === null || _e === void 0 ? void 0 : _e.notes) || "",
                prescriptionDate: record.prescriptionIssuedAt || record.createdAt,
                status: record.status === "completed" ? "active" : record.status,
                doctor: {
                    _id: record.doctor._id,
                    name: record.doctor.name,
                    specialty: record.doctor.specialty,
                    workplace: record.doctor.workplace,
                    phone: record.doctor.phone,
                },
                patient: record.patient,
                medicalRecord: {
                    _id: record._id,
                    diagnosis: record.diagnosis || record.preliminaryDiagnosis,
                    preliminaryDiagnosis: record.preliminaryDiagnosis,
                    consultationType: record.consultationType,
                    createdAt: record.createdAt,
                },
            };
        });
        const total = yield MedicalRecord_1.default.countDocuments(searchFilter);
        res.json({
            prescriptions,
            pagination: {
                current: pageNum,
                total: Math.ceil(total / limitNum),
                count: total,
                limit: limitNum,
            },
        });
    }
    catch (error) {
        console.error("Error searching prescriptions:", error);
        res.status(500).json({ message: "Lỗi tìm kiếm đơn thuốc", error });
    }
});
exports.searchPrescriptions = searchPrescriptions;
// Patient: Lấy đơn thuốc theo khoảng thời gian
const getPrescriptionsByDateRange = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId, startDate, endDate, page = 1, limit = 10, } = req.query;
        if (!patientId || !startDate || !endDate) {
            res
                .status(400)
                .json({ message: "Thiếu patientId, startDate hoặc endDate" });
            return;
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const filter = {
            patient: patientId,
            status: "completed",
            $or: [
                { "prescription.medications": { $exists: true, $ne: [] } },
                { "treatment.medicationsList": { $exists: true, $ne: [] } },
            ],
            createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            },
        };
        const records = yield MedicalRecord_1.default.find(filter)
            .populate({
            path: "doctor",
            select: "name specialty workplace phone",
            populate: {
                path: "specialty",
                select: "name",
            },
        })
            .populate("patient", "name email phone")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean();
        // Transform to prescription format
        const prescriptions = records.map((record) => {
            var _a, _b, _c, _d, _e;
            let medications = [];
            if (((_b = (_a = record.prescription) === null || _a === void 0 ? void 0 : _a.medications) === null || _b === void 0 ? void 0 : _b.length) > 0) {
                medications = record.prescription.medications;
            }
            else if (typeof record.treatment === "object" &&
                ((_d = (_c = record.treatment) === null || _c === void 0 ? void 0 : _c.medicationsList) === null || _d === void 0 ? void 0 : _d.length) > 0) {
                medications = record.treatment.medicationsList.map((med) => {
                    var _a;
                    return ({
                        name: med.drugName,
                        strength: med.strength,
                        form: med.form,
                        dosage: med.dosage,
                        frequency: ((_a = med.frequency) === null || _a === void 0 ? void 0 : _a.toString()) || "1",
                        duration: med.duration,
                        quantity: med.quantity,
                        instructions: med.instructions,
                    });
                });
            }
            return {
                _id: `${record._id}_prescription`,
                recordId: record._id,
                patientId: record.patient._id,
                doctorId: record.doctor._id,
                appointmentId: record.appointment,
                medications,
                notes: ((_e = record.prescription) === null || _e === void 0 ? void 0 : _e.notes) || "",
                prescriptionDate: record.prescriptionIssuedAt || record.createdAt,
                status: record.status === "completed" ? "active" : record.status,
                doctor: record.doctor,
                patient: record.patient,
                medicalRecord: {
                    _id: record._id,
                    diagnosis: record.diagnosis || record.preliminaryDiagnosis,
                    preliminaryDiagnosis: record.preliminaryDiagnosis,
                    consultationType: record.consultationType,
                    createdAt: record.createdAt,
                },
            };
        });
        const total = yield MedicalRecord_1.default.countDocuments(filter);
        res.json({
            prescriptions,
            pagination: {
                current: pageNum,
                total: Math.ceil(total / limitNum),
                count: total,
                limit: limitNum,
            },
        });
    }
    catch (error) {
        console.error("Error fetching prescriptions by date range:", error);
        res
            .status(500)
            .json({ message: "Lỗi lấy đơn thuốc theo thời gian", error });
    }
});
exports.getPrescriptionsByDateRange = getPrescriptionsByDateRange;
// Patient: Lấy đơn thuốc theo trạng thái
const getPrescriptionsByStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId, status, page = 1, limit = 10, } = req.query;
        if (!patientId || !status) {
            res.status(400).json({ message: "Thiếu patientId hoặc status" });
            return;
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Map status for medical records
        let recordStatus = "completed";
        if (status === "cancelled") {
            recordStatus = "cancelled";
        }
        else if (status === "completed") {
            recordStatus = "archived";
        }
        const filter = {
            patient: patientId,
            status: recordStatus,
            $or: [
                { "prescription.medications": { $exists: true, $ne: [] } },
                { "treatment.medicationsList": { $exists: true, $ne: [] } },
            ],
        };
        const records = yield MedicalRecord_1.default.find(filter)
            .populate({
            path: "doctor",
            select: "name specialty workplace phone",
            populate: {
                path: "specialty",
                select: "name",
            },
        })
            .populate("patient", "name email phone")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean();
        // Transform to prescription format
        const prescriptions = records.map((record) => {
            var _a, _b, _c, _d, _e;
            let medications = [];
            if (((_b = (_a = record.prescription) === null || _a === void 0 ? void 0 : _a.medications) === null || _b === void 0 ? void 0 : _b.length) > 0) {
                medications = record.prescription.medications;
            }
            else if (typeof record.treatment === "object" &&
                ((_d = (_c = record.treatment) === null || _c === void 0 ? void 0 : _c.medicationsList) === null || _d === void 0 ? void 0 : _d.length) > 0) {
                medications = record.treatment.medicationsList.map((med) => {
                    var _a;
                    return ({
                        name: med.drugName,
                        strength: med.strength,
                        form: med.form,
                        dosage: med.dosage,
                        frequency: ((_a = med.frequency) === null || _a === void 0 ? void 0 : _a.toString()) || "1",
                        duration: med.duration,
                        quantity: med.quantity,
                        instructions: med.instructions,
                    });
                });
            }
            return {
                _id: `${record._id}_prescription`,
                recordId: record._id,
                patientId: record.patient._id,
                doctorId: record.doctor._id,
                appointmentId: record.appointment,
                medications,
                notes: ((_e = record.prescription) === null || _e === void 0 ? void 0 : _e.notes) || "",
                prescriptionDate: record.prescriptionIssuedAt || record.createdAt,
                status: status, // Use requested status
                doctor: record.doctor,
                patient: record.patient,
                medicalRecord: {
                    _id: record._id,
                    diagnosis: record.diagnosis || record.preliminaryDiagnosis,
                    preliminaryDiagnosis: record.preliminaryDiagnosis,
                    consultationType: record.consultationType,
                    createdAt: record.createdAt,
                },
            };
        });
        const total = yield MedicalRecord_1.default.countDocuments(filter);
        res.json({
            prescriptions,
            pagination: {
                current: pageNum,
                total: Math.ceil(total / limitNum),
                count: total,
                limit: limitNum,
            },
        });
    }
    catch (error) {
        console.error("Error fetching prescriptions by status:", error);
        res
            .status(500)
            .json({ message: "Lỗi lấy đơn thuốc theo trạng thái", error });
    }
});
exports.getPrescriptionsByStatus = getPrescriptionsByStatus;
