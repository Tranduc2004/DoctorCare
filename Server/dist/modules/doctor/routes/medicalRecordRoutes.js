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
const express_1 = require("express");
const controllers_1 = require("../controllers");
const MedicalRecord_1 = __importDefault(require("../../patient/models/MedicalRecord"));
const router = (0, express_1.Router)();
// Debug endpoint to check if medical record exists
router.get("/debug/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        console.log("=== DEBUG MEDICAL RECORD ===");
        console.log("Checking medical record ID:", id);
        const record = yield MedicalRecord_1.default.findById(id);
        console.log("Record found:", record ? "YES" : "NO");
        if (record) {
            console.log("Record details:", {
                id: record._id,
                patient: record.patient,
                doctor: record.doctor,
                status: record.status,
                createdAt: record.createdAt,
            });
        }
        res.json({
            exists: !!record,
            record: record
                ? {
                    id: record._id,
                    patient: record.patient,
                    doctor: record.doctor,
                    status: record.status,
                    createdAt: record.createdAt,
                }
                : null,
        });
    }
    catch (error) {
        console.error("Debug endpoint error:", error);
        res.status(500).json({
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}));
// Doctor: Quản lý hồ sơ bệnh án
router.post("/", controllers_1.createMedicalRecord);
router.get("/", controllers_1.getDoctorMedicalRecords); // Route cho query ?doctorId=xxx
router.get("/my", controllers_1.getDoctorMedicalRecords);
router.get("/patients/completed", controllers_1.getPatientsWithCompletedAppointments);
router.get("/patient/:patientId", controllers_1.getPatientMedicalRecords);
router.get("/:id", controllers_1.getMedicalRecordDetail);
router.put("/:id", controllers_1.updateMedicalRecord);
// Doctor: Hồ sơ bệnh án từ appointment
router.post("/from-appointment/:appointmentId", controllers_1.createMedicalRecordFromAppointment);
router.get("/by-appointment/:appointmentId", controllers_1.getMedicalRecordByAppointment);
// Doctor: Lấy tiền sử bệnh án của bệnh nhân
router.get("/patient/:patientId/history", controllers_1.getPatientMedicalHistory);
exports.default = router;
