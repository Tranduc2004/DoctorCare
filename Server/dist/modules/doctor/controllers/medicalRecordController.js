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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPatientMedicalHistory = exports.getPatientsWithCompletedAppointments = exports.getMedicalRecordByAppointment = exports.createMedicalRecordFromAppointment = exports.getMedicalRecordDetail = exports.getDoctorMedicalRecords = exports.updateMedicalRecord = exports.getPatientMedicalRecords = exports.createMedicalRecord = void 0;
const MedicalRecord_1 = __importDefault(require("../../patient/models/MedicalRecord"));
const Appointment_1 = __importDefault(require("../../patient/models/Appointment"));
const axios_1 = __importDefault(require("axios"));
// Doctor: Tạo hồ sơ bệnh án mới
const createMedicalRecord = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patient, doctor, diagnosis, treatment, notes } = req.body;
        if (!patient || !doctor || !diagnosis || !treatment) {
            res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
            return;
        }
        const record = new MedicalRecord_1.default({
            patient,
            doctor,
            diagnosis,
            treatment,
            notes: notes || "",
        });
        yield record.save();
        res.status(201).json({
            message: "Tạo hồ sơ bệnh án thành công",
            record,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi tạo hồ sơ bệnh án", error });
    }
});
exports.createMedicalRecord = createMedicalRecord;
// Doctor: Lấy hồ sơ bệnh án của bệnh nhân
const getPatientMedicalRecords = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId, doctorId } = req.query;
        if (!patientId) {
            res.status(400).json({ message: "Thiếu patientId" });
            return;
        }
        const records = yield MedicalRecord_1.default.find({ patient: patientId })
            .populate("doctor", "name specialty")
            .populate("patient", "name email phone")
            .sort({ createdAt: -1 })
            .lean();
        res.json(records);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy hồ sơ bệnh án", error });
    }
});
exports.getPatientMedicalRecords = getPatientMedicalRecords;
// Doctor: Cập nhật hồ sơ bệnh án
const updateMedicalRecord = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { id } = req.params;
        const { doctorId } = req.body;
        const updateData = req.body;
        console.log("=== UPDATE MEDICAL RECORD DEBUG ===");
        console.log("Update request received:", {
            id,
            doctorId,
            updateDataKeys: Object.keys(updateData),
            bodySize: JSON.stringify(updateData).length,
        });
        // Specific logging for clinical examination field
        if (updateData.clinicalExamination) {
            console.log("=== CLINICAL EXAMINATION FIELD DEBUG ===");
            console.log("clinicalExamination type:", typeof updateData.clinicalExamination);
            console.log("clinicalExamination value:", updateData.clinicalExamination);
            console.log("clinicalExamination JSON:", JSON.stringify(updateData.clinicalExamination, null, 2));
        }
        // Specific logging for medicalHistory field
        if (updateData.medicalHistory) {
            console.log("=== MEDICAL HISTORY FIELD DEBUG ===");
            console.log("medicalHistory type:", typeof updateData.medicalHistory);
            console.log("medicalHistory value:", updateData.medicalHistory);
            console.log("medicalHistory JSON:", JSON.stringify(updateData.medicalHistory, null, 2));
        }
        // Specific logging for diagnosis fields
        if (updateData.finalDiagnosis !== undefined) {
            console.log("=== FINAL DIAGNOSIS FIELD DEBUG ===");
            console.log("finalDiagnosis type:", typeof updateData.finalDiagnosis);
            console.log("finalDiagnosis value:", updateData.finalDiagnosis);
        }
        if (updateData.preliminaryDiagnosis !== undefined) {
            console.log("=== PRELIMINARY DIAGNOSIS FIELD DEBUG ===");
            console.log("preliminaryDiagnosis type:", typeof updateData.preliminaryDiagnosis);
            console.log("preliminaryDiagnosis value:", updateData.preliminaryDiagnosis);
        }
        // Validate required fields
        if (!id) {
            console.log("ERROR: Missing medical record ID");
            res.status(400).json({ message: "Thiếu ID hồ sơ bệnh án" });
            return;
        }
        if (!doctorId) {
            console.log("ERROR: Missing doctorId");
            res.status(400).json({ message: "Thiếu doctorId" });
            return;
        }
        // Kiểm tra xem hồ sơ có thuộc về bác sĩ này không
        console.log("Finding medical record with ID:", id, "and doctor:", doctorId);
        const record = yield MedicalRecord_1.default.findOne({ _id: id, doctor: doctorId });
        if (!record) {
            console.log("ERROR: Medical record not found or doesn't belong to doctor");
            res.status(404).json({ message: "Không tìm thấy hồ sơ bệnh án" });
            return;
        }
        console.log("Found medical record, proceeding with update");
        console.log("Original record patient:", record.patient);
        // Remove doctorId from updateData to avoid conflicts
        const { doctorId: _ } = updateData, cleanUpdateData = __rest(updateData, ["doctorId"]);
        console.log("Clean update data keys:", Object.keys(cleanUpdateData));
        // Map finalDiagnosis to diagnosis for consistency across all roles
        if (cleanUpdateData.finalDiagnosis !== undefined) {
            console.log("Mapping finalDiagnosis to diagnosis field:", cleanUpdateData.finalDiagnosis);
            cleanUpdateData.diagnosis = cleanUpdateData.finalDiagnosis;
            // Also update the diagnosis object for structured access
            if (!cleanUpdateData.diagnosis) {
                cleanUpdateData.diagnosis = {};
            }
            if (typeof cleanUpdateData.diagnosis === "string") {
                // If diagnosis is a string, convert to object format and preserve string
                const diagnosisString = cleanUpdateData.diagnosis;
                cleanUpdateData.diagnosis = {
                    primaryDiagnosis: diagnosisString,
                };
            }
            else if (typeof cleanUpdateData.diagnosis === "object") {
                // If diagnosis is already an object, just update primaryDiagnosis
                cleanUpdateData.diagnosis.primaryDiagnosis =
                    cleanUpdateData.finalDiagnosis;
            }
        }
        console.log("Attempting MongoDB update...");
        const updatedRecord = yield MedicalRecord_1.default.findByIdAndUpdate(id, cleanUpdateData, {
            new: true,
            runValidators: false, // Skip validation for partial updates
            upsert: false,
        }).populate("patient doctor", "name email");
        console.log("MongoDB update result:", updatedRecord ? "SUCCESS" : "FAILED");
        if (updatedRecord) {
            console.log("Updated record ID:", updatedRecord._id);
        }
        // Sync patient profile if medical record contains relevant data
        try {
            if (updatedRecord &&
                (updateData.administrativeSnapshot ||
                    ((_a = updateData.quickScreening) === null || _a === void 0 ? void 0 : _a.allergies) ||
                    ((_b = updateData.quickScreening) === null || _b === void 0 ? void 0 : _b.currentMedications) ||
                    ((_c = updateData.quickScreening) === null || _c === void 0 ? void 0 : _c.vitals))) {
                // Get patient ID safely
                const patientId = updatedRecord.patient && typeof updatedRecord.patient === "object"
                    ? updatedRecord.patient._id
                    : updatedRecord.patient;
                // Call the sync API internally
                const syncData = {
                    patientId: patientId,
                    medicalRecordData: cleanUpdateData,
                    doctorId: doctorId,
                };
                // Make internal API call to sync profile
                const baseURL = process.env.BASE_URL || "http://localhost:5000";
                yield axios_1.default.post(`${baseURL}/api/patient/profile/sync-from-medical-record`, syncData);
                console.log("Patient profile synced successfully from medical record update");
            }
        }
        catch (syncError) {
            console.error("Error syncing patient profile:", syncError);
            // Don't fail the main operation if sync fails
        }
        res.json(updatedRecord);
    }
    catch (error) {
        console.error("=== ERROR IN UPDATE MEDICAL RECORD ===");
        console.error("Error type:", (_d = error === null || error === void 0 ? void 0 : error.constructor) === null || _d === void 0 ? void 0 : _d.name);
        console.error("Error message:", error instanceof Error ? error.message : error);
        console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
        console.error("Request params:", req.params);
        console.error("Request body keys:", Object.keys(req.body));
        console.error("Full error object:", error);
        res.status(500).json({
            message: "Lỗi cập nhật hồ sơ bệnh án",
            error: error instanceof Error ? error.message : error,
            details: process.env.NODE_ENV === "development" ? error : undefined,
        });
    }
});
exports.updateMedicalRecord = updateMedicalRecord;
// Doctor: Lấy tất cả hồ sơ bệnh án của bác sĩ
const getDoctorMedicalRecords = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { doctorId } = req.query;
        if (!doctorId) {
            res.status(400).json({ message: "Thiếu doctorId" });
            return;
        }
        const records = yield MedicalRecord_1.default.find({ doctor: doctorId })
            .populate("patient", "name email phone")
            .sort({ createdAt: -1 })
            .lean();
        res.json(records);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy hồ sơ bệnh án", error });
    }
});
exports.getDoctorMedicalRecords = getDoctorMedicalRecords;
// Doctor: Lấy chi tiết hồ sơ bệnh án
const getMedicalRecordDetail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { doctorId } = req.query;
        if (!doctorId) {
            res.status(400).json({ message: "Thiếu doctorId" });
            return;
        }
        const record = yield MedicalRecord_1.default.findOne({ _id: id, doctor: doctorId })
            .populate("patient", "name email phone")
            .populate("doctor", "name specialty");
        if (!record) {
            res.status(404).json({ message: "Không tìm thấy hồ sơ bệnh án" });
            return;
        }
        res.json(record);
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi lấy chi tiết hồ sơ bệnh án", error });
    }
});
exports.getMedicalRecordDetail = getMedicalRecordDetail;
// Doctor: Tạo hồ sơ bệnh án từ appointment
const createMedicalRecordFromAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { appointmentId } = req.params;
        const { doctorId } = req.body;
        console.log("=== CREATE MEDICAL RECORD FROM APPOINTMENT ===");
        console.log("appointmentId:", appointmentId);
        console.log("doctorId:", doctorId);
        if (!appointmentId || !doctorId) {
            res.status(400).json({ message: "Thiếu appointmentId hoặc doctorId" });
            return;
        }
        // Kiểm tra xem đã có hồ sơ bệnh án cho appointment này chưa (Double check for safety)
        const existingRecord = yield MedicalRecord_1.default.findOne({ appointmentId });
        if (existingRecord) {
            console.log("Medical record already exists:", existingRecord._id);
            // Return the existing record instead of creating duplicate
            const populatedRecord = yield MedicalRecord_1.default.findById(existingRecord._id)
                .populate("patient", "name email phone")
                .populate("doctor", "name specialty");
            res.status(200).json({
                message: "Hồ sơ bệnh án đã tồn tại",
                record: populatedRecord,
                isExisting: true,
            });
            return;
        }
        // Kiểm tra appointment có tồn tại và thuộc về bác sĩ này không
        const appointment = yield Appointment_1.default.findOne({
            _id: appointmentId,
            doctorId: doctorId,
        }).populate("patientId");
        if (!appointment) {
            res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
            return;
        }
        // Lấy thông tin bệnh nhân
        const patient = appointment.patientId;
        console.log("Creating new medical record...");
        // Lấy tiền sử bệnh án để tự động điền thông tin
        let previousMedicalHistory = null;
        try {
            const previousRecords = yield MedicalRecord_1.default.find({
                patient: patient._id,
                status: { $in: ["completed", "final"] },
            })
                .sort({ completedAt: -1, createdAt: -1 })
                .limit(1)
                .lean();
            if (previousRecords.length > 0) {
                previousMedicalHistory = previousRecords[0];
                console.log("Found previous medical history for auto-fill");
            }
        }
        catch (historyError) {
            console.log("Could not fetch previous history:", historyError);
            // Continue without previous history
        }
        // Tạo hồ sơ bệnh án mới với thông tin cơ bản và tự động điền từ tiền sử
        const medicalRecord = new MedicalRecord_1.default({
            appointmentId: appointment._id,
            patient: patient._id,
            doctor: doctorId,
            consultationType: appointment.mode || "offline",
            patientInfo: {
                fullName: patient.name || patient.fullName || "",
                birthYear: patient.birthYear,
                gender: patient.gender,
                insuranceNumber: patient.insuranceNumber,
                emergencyContactName: patient.emergencyContactName,
                emergencyContactPhone: patient.emergencyContactPhone,
            },
            // Tự động điền tiền sử bệnh tật từ lần khám trước
            medicalHistory: (previousMedicalHistory === null || previousMedicalHistory === void 0 ? void 0 : previousMedicalHistory.medicalHistory)
                ? {
                    pastMedicalHistory: previousMedicalHistory.medicalHistory.pastMedicalHistory || "",
                    surgicalHistory: previousMedicalHistory.medicalHistory.surgicalHistory || "",
                    familyHistory: previousMedicalHistory.medicalHistory.familyHistory || "",
                    socialHistory: typeof previousMedicalHistory.medicalHistory.socialHistory ===
                        "string"
                        ? previousMedicalHistory.medicalHistory.socialHistory
                        : "",
                }
                : undefined,
            // Tự động điền yếu tố nguy cơ
            riskFactors: Array.isArray(previousMedicalHistory === null || previousMedicalHistory === void 0 ? void 0 : previousMedicalHistory.riskFactors)
                ? previousMedicalHistory.riskFactors
                : typeof (previousMedicalHistory === null || previousMedicalHistory === void 0 ? void 0 : previousMedicalHistory.riskFactors) === "string"
                    ? [previousMedicalHistory.riskFactors]
                    : [],
            // Tự động điền thông tin dị ứng và thuốc hiện tại
            quickScreening: {
                allergies: ((_a = previousMedicalHistory === null || previousMedicalHistory === void 0 ? void 0 : previousMedicalHistory.quickScreening) === null || _a === void 0 ? void 0 : _a.allergies) ||
                    ((previousMedicalHistory === null || previousMedicalHistory === void 0 ? void 0 : previousMedicalHistory.allergies)
                        ? {
                            hasAllergies: !!previousMedicalHistory.allergies,
                            allergyList: previousMedicalHistory.allergies,
                        }
                        : {
                            hasAllergies: false,
                            allergyList: "",
                        }),
                currentMedications: ((_b = previousMedicalHistory === null || previousMedicalHistory === void 0 ? void 0 : previousMedicalHistory.quickScreening) === null || _b === void 0 ? void 0 : _b.currentMedications) ||
                    (previousMedicalHistory === null || previousMedicalHistory === void 0 ? void 0 : previousMedicalHistory.currentMedications) ||
                    "",
                // Tự động điền thông tin thai sản (nếu có và là nữ giới)
                pregnancyStatus: patient.gender === "female" &&
                    ((_c = previousMedicalHistory === null || previousMedicalHistory === void 0 ? void 0 : previousMedicalHistory.quickScreening) === null || _c === void 0 ? void 0 : _c.pregnancyStatus)
                    ? previousMedicalHistory.quickScreening.pregnancyStatus
                    : patient.gender === "female" &&
                        (previousMedicalHistory === null || previousMedicalHistory === void 0 ? void 0 : previousMedicalHistory.pregnancyStatus)
                        ? {
                            isPregnant: previousMedicalHistory.pregnancyStatus === "yes",
                            isBreastfeeding: false,
                            gestationalWeeks: 0,
                        }
                        : undefined,
            },
            // Thông tin khám hiện tại
            reasonForVisit: "Khám tổng quát",
            chiefComplaint: appointment.symptoms || "Chưa có triệu chứng cụ thể",
            preliminaryDiagnosis: "Chưa có chẩn đoán sơ bộ",
            diagnosis: "Chưa có chẩn đoán cuối cùng",
            treatment: "Chưa có phương pháp điều trị",
            status: "draft",
        });
        yield medicalRecord.save();
        console.log("Medical record created successfully:", medicalRecord._id);
        // Populate thông tin để trả về
        const populatedRecord = yield MedicalRecord_1.default.findById(medicalRecord._id)
            .populate("patient", "name email phone")
            .populate("doctor", "name specialty");
        res.status(201).json({
            message: "Tạo hồ sơ bệnh án thành công",
            record: populatedRecord,
            isExisting: false,
        });
    }
    catch (error) {
        console.error("Error creating medical record from appointment:", error);
        // If it's a duplicate key error (E11000), return the existing record
        if ((error === null || error === void 0 ? void 0 : error.code) === 11000 && ((_d = error === null || error === void 0 ? void 0 : error.keyPattern) === null || _d === void 0 ? void 0 : _d.appointmentId)) {
            console.log("Duplicate key error, fetching existing record...");
            try {
                const existingRecord = yield MedicalRecord_1.default.findOne({
                    appointmentId: req.params.appointmentId,
                })
                    .populate("patient", "name email phone")
                    .populate("doctor", "name specialty");
                if (existingRecord) {
                    res.status(200).json({
                        message: "Hồ sơ bệnh án đã tồn tại",
                        record: existingRecord,
                        isExisting: true,
                    });
                    return;
                }
            }
            catch (fetchError) {
                console.error("Error fetching existing record:", fetchError);
            }
        }
        res
            .status(500)
            .json({ message: "Lỗi tạo hồ sơ bệnh án từ lịch hẹn", error });
    }
});
exports.createMedicalRecordFromAppointment = createMedicalRecordFromAppointment;
// Doctor: Lấy hồ sơ bệnh án theo appointmentId
const getMedicalRecordByAppointment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { appointmentId } = req.params;
        const { doctorId } = req.query;
        if (!appointmentId) {
            res.status(400).json({ message: "Thiếu appointmentId" });
            return;
        }
        const record = yield MedicalRecord_1.default.findOne(Object.assign({ appointmentId }, (doctorId && { doctor: doctorId })))
            .populate("patient", "name email phone")
            .populate("doctor", "name specialty")
            .populate("appointmentId", "type date time");
        if (!record) {
            res.json({
                record: null,
                message: "Chưa có hồ sơ bệnh án cho lịch hẹn này",
            });
            return;
        }
        res.json(record);
    }
    catch (error) {
        console.error("Error getting medical record by appointment:", error);
        res
            .status(500)
            .json({ message: "Lỗi lấy hồ sơ bệnh án theo lịch hẹn", error });
    }
});
exports.getMedicalRecordByAppointment = getMedicalRecordByAppointment;
// Doctor: Lấy danh sách bệnh nhân với lịch hẹn hoàn thành để quản lý hồ sơ bệnh án
const getPatientsWithCompletedAppointments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { doctorId } = req.query;
        if (!doctorId) {
            res.status(400).json({ message: "Thiếu doctorId" });
            return;
        }
        // Lấy tất cả lịch hẹn hoàn thành của bác sĩ
        const completedAppointments = yield Appointment_1.default.find({
            doctorId,
            status: {
                $in: ["completed", "prescription_issued", "final", "closed"],
            },
        })
            .populate({
            path: "patientId",
            select: "name email phone avatar dateOfBirth gender address",
            model: "Patient",
        })
            .populate({
            path: "scheduleId",
            select: "date startTime endTime",
            model: "DoctorSchedule",
        })
            .sort({ createdAt: -1 })
            .lean();
        // Nhóm theo bệnh nhân và lấy thông tin hồ sơ bệnh án
        const patientMap = new Map();
        for (const appointment of completedAppointments) {
            const patientId = appointment.patientId._id.toString();
            if (!patientMap.has(patientId)) {
                // Lấy hồ sơ bệnh án của bệnh nhân này
                const medicalRecords = yield MedicalRecord_1.default.find({
                    patient: patientId,
                    doctor: doctorId,
                })
                    .populate("appointmentId", "date time")
                    .sort({ createdAt: -1 })
                    .lean();
                patientMap.set(patientId, {
                    patient: appointment.patientId,
                    appointments: [],
                    medicalRecords: medicalRecords,
                    lastAppointment: null,
                    totalAppointments: 0,
                });
            }
            const patientData = patientMap.get(patientId);
            patientData.appointments.push({
                _id: appointment._id,
                appointmentDate: appointment.appointmentDate,
                appointmentTime: appointment.appointmentTime,
                status: appointment.status,
                symptoms: appointment.symptoms,
                diagnosis: appointment.diagnosis,
                schedule: appointment.scheduleId,
                createdAt: appointment.createdAt,
                updatedAt: appointment.updatedAt,
            });
            // Cập nhật lịch hẹn gần nhất
            if (!patientData.lastAppointment ||
                (appointment.createdAt &&
                    patientData.lastAppointment.createdAt &&
                    new Date(appointment.createdAt) >
                        new Date(patientData.lastAppointment.createdAt))) {
                patientData.lastAppointment = {
                    _id: appointment._id,
                    appointmentDate: appointment.appointmentDate,
                    appointmentTime: appointment.appointmentTime,
                    status: appointment.status,
                    schedule: appointment.scheduleId,
                    createdAt: appointment.createdAt,
                };
            }
            patientData.totalAppointments = patientData.appointments.length;
        }
        // Chuyển Map thành Array và format theo interface PatientWithCompletedAppointment
        const patientsWithRecords = Array.from(patientMap.values()).map((patientData) => ({
            _id: patientData.patient._id,
            fullName: patientData.patient.name,
            email: patientData.patient.email,
            phone: patientData.patient.phone,
            avatar: patientData.patient.avatar,
            completedAppointments: patientData.appointments.map((appointment) => {
                const relatedMedicalRecord = patientData.medicalRecords.find((record) => record.appointmentId &&
                    record.appointmentId.toString() === appointment._id.toString());
                return {
                    _id: appointment._id,
                    appointmentTime: appointment.appointmentTime,
                    symptoms: appointment.symptoms,
                    status: appointment.status,
                    medicalRecord: relatedMedicalRecord
                        ? {
                            _id: relatedMedicalRecord._id,
                            status: relatedMedicalRecord.status,
                            preliminaryDiagnosis: relatedMedicalRecord.preliminaryDiagnosis,
                            finalDiagnosis: relatedMedicalRecord.finalDiagnosis,
                            createdAt: relatedMedicalRecord.createdAt,
                            updatedAt: relatedMedicalRecord.updatedAt,
                        }
                        : undefined,
                };
            }),
        }));
        res.json({
            success: true,
            data: patientsWithRecords,
            total: patientsWithRecords.length,
        });
    }
    catch (error) {
        console.error("Error getting patients with completed appointments:", error);
        res.status(500).json({
            message: "Lỗi lấy danh sách bệnh nhân với lịch hẹn hoàn thành",
            error,
        });
    }
});
exports.getPatientsWithCompletedAppointments = getPatientsWithCompletedAppointments;
// Doctor: Lấy tiền sử bệnh án của bệnh nhân để tham khảo
const getPatientMedicalHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { patientId } = req.params;
        const { doctorId } = req.query;
        if (!patientId) {
            res.status(400).json({ message: "Thiếu patientId" });
            return;
        }
        if (!doctorId) {
            res.status(400).json({ message: "Thiếu doctorId" });
            return;
        }
        // Lấy tất cả hồ sơ bệnh án đã hoàn thành của bệnh nhân (không giới hạn bác sĩ)
        const historicalRecords = yield MedicalRecord_1.default.find({
            patient: patientId,
            status: { $in: ["completed", "final"] },
        })
            .populate("doctor", "name specialty workplace")
            .select([
            // Tiền sử bệnh tật
            "medicalHistory.pastMedicalHistory",
            "medicalHistory.surgicalHistory",
            "medicalHistory.familyHistory",
            "medicalHistory.socialHistory",
            "riskFactors",
            // Dị ứng/thuốc
            "quickScreening.allergies.hasAllergies",
            "quickScreening.allergies.allergyList",
            "quickScreening.currentMedications",
            "allergies", // legacy
            "currentMedications", // legacy
            // Thai sản
            "quickScreening.pregnancyStatus.isPregnant",
            "quickScreening.pregnancyStatus.isBreastfeeding",
            "quickScreening.pregnancyStatus.gestationalWeeks",
            "pregnancyStatus", // legacy
            // Chẩn đoán/điều trị trước
            "diagnosis",
            "finalDiagnosis",
            "icdCodes",
            "treatmentPlan",
            "treatment",
            "prescription.medications",
            "preliminaryDiagnosis",
            // CLS quan trọng
            "paraclinicalIndications.laboratoryTests",
            "paraclinicalIndications.imagingStudies",
            "paraclinicalIndications.attachedResults",
            // Vitals để so sánh
            "quickScreening.vitals.temperature",
            "quickScreening.vitals.bloodPressure",
            "quickScreening.vitals.heartRate",
            "quickScreening.vitals.weight",
            "quickScreening.vitals.height",
            "quickScreening.vitals.oxygenSaturation",
            "quickScreening.vitals.bmi",
            "vitals", // legacy vitals
            // Metadata
            "createdAt",
            "completedAt",
            "doctor",
        ])
            .sort({ completedAt: -1 })
            .limit(10) // Giới hạn 10 lần khám gần nhất
            .lean();
        // Tổng hợp thông tin tiền sử từ các lần khám trước
        const consolidatedHistory = {
            // Tiền sử bệnh tật (lấy từ lần khám gần nhất có thông tin)
            medicalHistory: {
                pastMedicalHistory: "",
                surgicalHistory: "",
                familyHistory: "",
                socialHistory: "",
            },
            riskFactors: "",
            // Dị ứng hiện tại (ưu tiên lần khám gần nhất)
            currentAllergies: {
                hasAllergies: false,
                allergyList: "",
            },
            currentMedications: "",
            // Thai sản (nếu có - lần khám gần nhất)
            pregnancyInfo: {
                isPregnant: false,
                isBreastfeeding: false,
                gestationalWeeks: null,
            },
            // Chẩn đoán trước đây
            previousDiagnoses: [],
            // CLS quan trọng từ các lần khám trước
            importantTests: [],
            // Vitals trend (3 lần gần nhất để so sánh)
            vitalsHistory: [],
        };
        // Xử lý từng record để tổng hợp thông tin
        historicalRecords.forEach((record, index) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            // Tiền sử bệnh tật - lấy từ lần khám gần nhất có thông tin
            if (record.medicalHistory &&
                !consolidatedHistory.medicalHistory.pastMedicalHistory) {
                consolidatedHistory.medicalHistory = {
                    pastMedicalHistory: record.medicalHistory.pastMedicalHistory || "",
                    surgicalHistory: record.medicalHistory.surgicalHistory || "",
                    familyHistory: record.medicalHistory.familyHistory || "",
                    socialHistory: typeof record.medicalHistory.socialHistory === "string"
                        ? record.medicalHistory.socialHistory
                        : "",
                };
            }
            if (record.riskFactors && !consolidatedHistory.riskFactors) {
                consolidatedHistory.riskFactors = Array.isArray(record.riskFactors)
                    ? record.riskFactors.join(", ")
                    : record.riskFactors;
            }
            // Dị ứng - lấy từ lần khám gần nhất
            if (index === 0) {
                if ((_a = record.quickScreening) === null || _a === void 0 ? void 0 : _a.allergies) {
                    consolidatedHistory.currentAllergies = {
                        hasAllergies: record.quickScreening.allergies.hasAllergies || false,
                        allergyList: record.quickScreening.allergies.allergyList || "",
                    };
                }
                else if (record.allergies) {
                    consolidatedHistory.currentAllergies.allergyList = record.allergies;
                }
                consolidatedHistory.currentMedications =
                    ((_b = record.quickScreening) === null || _b === void 0 ? void 0 : _b.currentMedications) ||
                        record.currentMedications ||
                        "";
                // Thai sản
                if ((_c = record.quickScreening) === null || _c === void 0 ? void 0 : _c.pregnancyStatus) {
                    consolidatedHistory.pregnancyInfo = {
                        isPregnant: record.quickScreening.pregnancyStatus.isPregnant || false,
                        isBreastfeeding: record.quickScreening.pregnancyStatus.isBreastfeeding || false,
                        gestationalWeeks: record.quickScreening.pregnancyStatus.gestationalWeeks || null,
                    };
                }
            }
            // Chẩn đoán trước đây
            if (record.diagnosis || record.finalDiagnosis) {
                consolidatedHistory.previousDiagnoses.push({
                    diagnosis: record.finalDiagnosis || record.diagnosis || "",
                    icdCodes: record.icdCodes || [],
                    treatment: typeof record.treatment === "string" ? record.treatment : "",
                    date: record.completedAt
                        ? new Date(record.completedAt).toISOString()
                        : record.createdAt
                            ? new Date(record.createdAt).toISOString()
                            : "",
                    doctor: ((_d = record.doctor) === null || _d === void 0 ? void 0 : _d.name) || "Unknown",
                });
            }
            // CLS quan trọng
            if (record.paraclinicalIndications) {
                if ((_f = (_e = record.paraclinicalIndications.laboratoryTests) === null || _e === void 0 ? void 0 : _e.tests) === null || _f === void 0 ? void 0 : _f.length) {
                    consolidatedHistory.importantTests.push({
                        type: "laboratory",
                        tests: record.paraclinicalIndications.laboratoryTests.tests,
                        date: record.completedAt
                            ? new Date(record.completedAt).toISOString()
                            : record.createdAt
                                ? new Date(record.createdAt).toISOString()
                                : "",
                        doctor: ((_g = record.doctor) === null || _g === void 0 ? void 0 : _g.name) || "Unknown",
                    });
                }
                if ((_j = (_h = record.paraclinicalIndications.imagingStudies) === null || _h === void 0 ? void 0 : _h.studies) === null || _j === void 0 ? void 0 : _j.length) {
                    consolidatedHistory.importantTests.push({
                        type: "imaging",
                        tests: record.paraclinicalIndications.imagingStudies.studies,
                        date: record.completedAt
                            ? new Date(record.completedAt).toISOString()
                            : record.createdAt
                                ? new Date(record.createdAt).toISOString()
                                : "",
                        doctor: ((_k = record.doctor) === null || _k === void 0 ? void 0 : _k.name) || "Unknown",
                    });
                }
            }
            // Vitals history (chỉ lấy 3 lần gần nhất)
            if (consolidatedHistory.vitalsHistory.length < 3) {
                // Vitals có thể có trong quickScreening hoặc legacy vitals field
                const vitals = record.vitals ||
                    (record.quickScreening
                        ? {
                            temperature: record.quickScreening.temperature,
                            bloodPressure: record.quickScreening.bloodPressure,
                            heartRate: record.quickScreening.heartRate,
                            weight: record.quickScreening.weight,
                            height: record.quickScreening.height,
                            oxygenSaturation: record.quickScreening
                                .oxygenSaturation,
                            bmi: record.quickScreening.bmi,
                        }
                        : null);
                if (vitals && Object.keys(vitals).length > 0) {
                    consolidatedHistory.vitalsHistory.push({
                        date: record.completedAt
                            ? new Date(record.completedAt).toISOString()
                            : record.createdAt
                                ? new Date(record.createdAt).toISOString()
                                : "",
                        vitals: vitals,
                        doctor: ((_l = record.doctor) === null || _l === void 0 ? void 0 : _l.name) || "Unknown",
                    });
                }
            }
        });
        res.json({
            success: true,
            data: {
                patientId,
                totalRecords: historicalRecords.length,
                consolidatedHistory,
                recentRecords: historicalRecords.slice(0, 5), // 5 lần khám gần nhất
            },
        });
    }
    catch (error) {
        console.error("Error getting patient medical history:", error);
        res.status(500).json({
            message: "Lỗi lấy tiền sử bệnh án của bệnh nhân",
            error,
        });
    }
});
exports.getPatientMedicalHistory = getPatientMedicalHistory;
