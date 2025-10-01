import { Router } from "express";
import {
  createMedicalRecord,
  getPatientMedicalRecords,
  updateMedicalRecord,
  getDoctorMedicalRecords,
  getMedicalRecordDetail,
  createMedicalRecordFromAppointment,
  getMedicalRecordByAppointment,
  getPatientsWithCompletedAppointments,
} from "../controllers";
import MedicalRecord from "../../patient/models/MedicalRecord";

const router = Router();

// Debug endpoint to check if medical record exists
router.get("/debug/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("=== DEBUG MEDICAL RECORD ===");
    console.log("Checking medical record ID:", id);
    
    const record = await MedicalRecord.findById(id);
    console.log("Record found:", record ? "YES" : "NO");
    
    if (record) {
      console.log("Record details:", {
        id: record._id,
        patient: record.patient,
        doctor: record.doctor,
        status: record.status,
        createdAt: record.createdAt
      });
    }
    
    res.json({
      exists: !!record,
      record: record ? {
        id: record._id,
        patient: record.patient,
        doctor: record.doctor,
        status: record.status,
        createdAt: record.createdAt
      } : null
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Doctor: Quản lý hồ sơ bệnh án
router.post("/", createMedicalRecord);
router.get("/my", getDoctorMedicalRecords);
router.get("/patients/completed", getPatientsWithCompletedAppointments);
router.get("/patient/:patientId", getPatientMedicalRecords);
router.get("/:id", getMedicalRecordDetail);
router.put("/:id", updateMedicalRecord);

// Doctor: Hồ sơ bệnh án từ appointment
router.post("/from-appointment/:appointmentId", createMedicalRecordFromAppointment);
router.get("/by-appointment/:appointmentId", getMedicalRecordByAppointment);

export default router;
