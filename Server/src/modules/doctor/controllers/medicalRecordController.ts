import { Request, Response } from "express";
import MedicalRecord from "../../patient/models/MedicalRecord";
import Appointment from "../../patient/models/Appointment";
import Patient from "../../patient/models/Patient";
import axios from "axios";

// Doctor: Tạo hồ sơ bệnh án mới
export const createMedicalRecord = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { patient, doctor, diagnosis, treatment, notes } = req.body;

    if (!patient || !doctor || !diagnosis || !treatment) {
      res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
      return;
    }

    const record = new MedicalRecord({
      patient,
      doctor,
      diagnosis,
      treatment,
      notes: notes || "",
    });

    await record.save();
    res.status(201).json({
      message: "Tạo hồ sơ bệnh án thành công",
      record,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi tạo hồ sơ bệnh án", error });
  }
};

// Doctor: Lấy hồ sơ bệnh án của bệnh nhân
export const getPatientMedicalRecords = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { patientId, doctorId } = req.query as {
      patientId?: string;
      doctorId?: string;
    };

    if (!patientId) {
      res.status(400).json({ message: "Thiếu patientId" });
      return;
    }

    const records = await MedicalRecord.find({ patient: patientId })
      .populate("doctor", "name specialty")
      .populate("patient", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy hồ sơ bệnh án", error });
  }
};

// Doctor: Cập nhật hồ sơ bệnh án
export const updateMedicalRecord = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { doctorId } = req.body as { doctorId: string };
    const updateData = req.body;

    console.log("=== UPDATE MEDICAL RECORD DEBUG ===");
    console.log("Update request received:", { 
      id, 
      doctorId, 
      updateDataKeys: Object.keys(updateData),
      bodySize: JSON.stringify(updateData).length 
    });

    // Specific logging for medicalHistory field
    if (updateData.medicalHistory) {
      console.log("=== MEDICAL HISTORY FIELD DEBUG ===");
      console.log("medicalHistory type:", typeof updateData.medicalHistory);
      console.log("medicalHistory value:", updateData.medicalHistory);
      console.log("medicalHistory JSON:", JSON.stringify(updateData.medicalHistory, null, 2));
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
    const record = await MedicalRecord.findOne({ _id: id, doctor: doctorId });
    if (!record) {
      console.log("ERROR: Medical record not found or doesn't belong to doctor");
      res.status(404).json({ message: "Không tìm thấy hồ sơ bệnh án" });
      return;
    }

    console.log("Found medical record, proceeding with update");
    console.log("Original record patient:", record.patient);
    
    // Remove doctorId from updateData to avoid conflicts
    const { doctorId: _, ...cleanUpdateData } = updateData;
    console.log("Clean update data keys:", Object.keys(cleanUpdateData));
    
    console.log("Attempting MongoDB update...");
    const updatedRecord = await MedicalRecord.findByIdAndUpdate(
      id,
      cleanUpdateData,
      { 
        new: true,
        runValidators: false, // Skip validation for partial updates
        upsert: false
      }
    ).populate("patient doctor", "name email");

    console.log("MongoDB update result:", updatedRecord ? "SUCCESS" : "FAILED");
    if (updatedRecord) {
      console.log("Updated record ID:", updatedRecord._id);
    }

    // Sync patient profile if medical record contains relevant data
    try {
      if (
        updatedRecord &&
        (updateData.administrativeSnapshot ||
          updateData.quickScreening?.allergies ||
          updateData.quickScreening?.currentMedications ||
          updateData.quickScreening?.vitals)
      ) {
        // Get patient ID safely
        const patientId =
          updatedRecord.patient && typeof updatedRecord.patient === "object"
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
        await axios.post(
          `${baseURL}/api/patient/profile/sync-from-medical-record`,
          syncData
        );

        console.log(
          "Patient profile synced successfully from medical record update"
        );
      }
    } catch (syncError) {
      console.error("Error syncing patient profile:", syncError);
      // Don't fail the main operation if sync fails
    }

    res.json(updatedRecord);
  } catch (error) {
    console.error("=== ERROR IN UPDATE MEDICAL RECORD ===");
    console.error("Error type:", error?.constructor?.name);
    console.error("Error message:", error instanceof Error ? error.message : error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    console.error("Request params:", req.params);
    console.error("Request body keys:", Object.keys(req.body));
    console.error("Full error object:", error);
    
    res.status(500).json({
      message: "Lỗi cập nhật hồ sơ bệnh án",
      error: error instanceof Error ? error.message : error,
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Doctor: Lấy tất cả hồ sơ bệnh án của bác sĩ
export const getDoctorMedicalRecords = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { doctorId } = req.query as { doctorId?: string };

    if (!doctorId) {
      res.status(400).json({ message: "Thiếu doctorId" });
      return;
    }

    const records = await MedicalRecord.find({ doctor: doctorId })
      .populate("patient", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy hồ sơ bệnh án", error });
  }
};

// Doctor: Lấy chi tiết hồ sơ bệnh án
export const getMedicalRecordDetail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { doctorId } = req.query as { doctorId?: string };

    if (!doctorId) {
      res.status(400).json({ message: "Thiếu doctorId" });
      return;
    }

    const record = await MedicalRecord.findOne({ _id: id, doctor: doctorId })
      .populate("patient", "name email phone")
      .populate("doctor", "name specialty");

    if (!record) {
      res.status(404).json({ message: "Không tìm thấy hồ sơ bệnh án" });
      return;
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy chi tiết hồ sơ bệnh án", error });
  }
};

// Doctor: Tạo hồ sơ bệnh án từ appointment
export const createMedicalRecordFromAppointment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const { doctorId } = req.body;

    if (!appointmentId || !doctorId) {
      res.status(400).json({ message: "Thiếu appointmentId hoặc doctorId" });
      return;
    }

    // Kiểm tra appointment có tồn tại và thuộc về bác sĩ này không
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId: doctorId,
    }).populate("patientId");

    if (!appointment) {
      res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
      return;
    }

    // Kiểm tra xem đã có hồ sơ bệnh án cho appointment này chưa
    const existingRecord = await MedicalRecord.findOne({ appointmentId });
    if (existingRecord) {
      res.status(400).json({
        message: "Hồ sơ bệnh án cho lịch hẹn này đã tồn tại",
        recordId: existingRecord._id,
      });
      return;
    }

    // Lấy thông tin bệnh nhân
    const patient = appointment.patientId as any;

    // Tạo hồ sơ bệnh án mới với thông tin cơ bản
    const medicalRecord = new MedicalRecord({
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
      reasonForVisit: "Khám tổng quát",
      chiefComplaint: appointment.symptoms || "Chưa có triệu chứng cụ thể",
      preliminaryDiagnosis: "Chưa có chẩn đoán sơ bộ",
      diagnosis: "Chưa có chẩn đoán cuối cùng",
      treatment: "Chưa có phương pháp điều trị",
      status: "draft",
    });

    await medicalRecord.save();

    // Populate thông tin để trả về
    const populatedRecord = await MedicalRecord.findById(medicalRecord._id)
      .populate("patient", "name email phone")
      .populate("doctor", "name specialty");

    res.status(201).json({
      message: "Tạo hồ sơ bệnh án thành công",
      record: populatedRecord,
    });
  } catch (error) {
    console.error("Error creating medical record from appointment:", error);
    res
      .status(500)
      .json({ message: "Lỗi tạo hồ sơ bệnh án từ lịch hẹn", error });
  }
};

// Doctor: Lấy hồ sơ bệnh án theo appointmentId
export const getMedicalRecordByAppointment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const { doctorId } = req.query;

    if (!appointmentId) {
      res.status(400).json({ message: "Thiếu appointmentId" });
      return;
    }

    const record = await MedicalRecord.findOne({
      appointmentId,
      ...(doctorId && { doctor: doctorId }),
    })
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
  } catch (error) {
    console.error("Error getting medical record by appointment:", error);
    res
      .status(500)
      .json({ message: "Lỗi lấy hồ sơ bệnh án theo lịch hẹn", error });
  }
};

// Doctor: Lấy danh sách bệnh nhân với lịch hẹn hoàn thành để quản lý hồ sơ bệnh án
export const getPatientsWithCompletedAppointments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { doctorId } = req.query as { doctorId?: string };

    if (!doctorId) {
      res.status(400).json({ message: "Thiếu doctorId" });
      return;
    }

    // Lấy tất cả lịch hẹn hoàn thành của bác sĩ
    const completedAppointments = await Appointment.find({
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
        const medicalRecords = await MedicalRecord.find({
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
      if (
        !patientData.lastAppointment ||
        (appointment.createdAt &&
          patientData.lastAppointment.createdAt &&
          new Date(appointment.createdAt) >
            new Date(patientData.lastAppointment.createdAt))
      ) {
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
    const patientsWithRecords = Array.from(patientMap.values()).map(patientData => ({
      _id: patientData.patient._id,
      fullName: patientData.patient.name,
      email: patientData.patient.email,
      phone: patientData.patient.phone,
      avatar: patientData.patient.avatar,
      completedAppointments: patientData.appointments.map((appointment: any) => {
         const relatedMedicalRecord = patientData.medicalRecords.find((record: any) => 
           record.appointmentId && record.appointmentId.toString() === appointment._id.toString()
         );
        
        return {
          _id: appointment._id,
          appointmentTime: appointment.appointmentTime,
          symptoms: appointment.symptoms,
          status: appointment.status,
          medicalRecord: relatedMedicalRecord ? {
            _id: relatedMedicalRecord._id,
            status: relatedMedicalRecord.status,
            preliminaryDiagnosis: relatedMedicalRecord.preliminaryDiagnosis,
            finalDiagnosis: relatedMedicalRecord.finalDiagnosis,
            createdAt: relatedMedicalRecord.createdAt,
            updatedAt: relatedMedicalRecord.updatedAt,
          } : undefined
        };
      })
    }));

    res.json({
      success: true,
      data: patientsWithRecords,
      total: patientsWithRecords.length,
    });
  } catch (error) {
    console.error("Error getting patients with completed appointments:", error);
    res.status(500).json({
      message: "Lỗi lấy danh sách bệnh nhân với lịch hẹn hoàn thành",
      error,
    });
  }
};
