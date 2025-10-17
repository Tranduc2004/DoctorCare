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
      bodySize: JSON.stringify(updateData).length,
    });

    // Specific logging for clinical examination field
    if (updateData.clinicalExamination) {
      console.log("=== CLINICAL EXAMINATION FIELD DEBUG ===");
      console.log(
        "clinicalExamination type:",
        typeof updateData.clinicalExamination
      );
      console.log("clinicalExamination value:", updateData.clinicalExamination);
      console.log(
        "clinicalExamination JSON:",
        JSON.stringify(updateData.clinicalExamination, null, 2)
      );
    }

    // Specific logging for medicalHistory field
    if (updateData.medicalHistory) {
      console.log("=== MEDICAL HISTORY FIELD DEBUG ===");
      console.log("medicalHistory type:", typeof updateData.medicalHistory);
      console.log("medicalHistory value:", updateData.medicalHistory);
      console.log(
        "medicalHistory JSON:",
        JSON.stringify(updateData.medicalHistory, null, 2)
      );
    }

    // Specific logging for diagnosis fields
    if (updateData.finalDiagnosis !== undefined) {
      console.log("=== FINAL DIAGNOSIS FIELD DEBUG ===");
      console.log("finalDiagnosis type:", typeof updateData.finalDiagnosis);
      console.log("finalDiagnosis value:", updateData.finalDiagnosis);
    }

    if (updateData.preliminaryDiagnosis !== undefined) {
      console.log("=== PRELIMINARY DIAGNOSIS FIELD DEBUG ===");
      console.log(
        "preliminaryDiagnosis type:",
        typeof updateData.preliminaryDiagnosis
      );
      console.log(
        "preliminaryDiagnosis value:",
        updateData.preliminaryDiagnosis
      );
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
      console.log(
        "ERROR: Medical record not found or doesn't belong to doctor"
      );
      res.status(404).json({ message: "Không tìm thấy hồ sơ bệnh án" });
      return;
    }

    console.log("Found medical record, proceeding with update");
    console.log("Original record patient:", record.patient);

    // Remove doctorId from updateData to avoid conflicts
    const { doctorId: _, ...cleanUpdateData } = updateData;
    console.log("Clean update data keys:", Object.keys(cleanUpdateData));

    // Map finalDiagnosis to diagnosis for consistency across all roles
    if (cleanUpdateData.finalDiagnosis !== undefined) {
      console.log(
        "Mapping finalDiagnosis to diagnosis field:",
        cleanUpdateData.finalDiagnosis
      );
      // Always store diagnosis as a string
      cleanUpdateData.diagnosis =
        typeof cleanUpdateData.finalDiagnosis === "object"
          ? cleanUpdateData.finalDiagnosis.primaryDiagnosis || ""
          : cleanUpdateData.finalDiagnosis;
    } // Additional validation for required fields when completing the record
    if (cleanUpdateData.status === "completed") {
      const validationErrors = [];

      if (!record.reasonForVisit && !cleanUpdateData.reasonForVisit) {
        validationErrors.push("Lý do khám");
      }
      if (!record.chiefComplaint && !cleanUpdateData.chiefComplaint) {
        validationErrors.push("Triệu chứng chính");
      }
      if (
        !record.preliminaryDiagnosis &&
        !cleanUpdateData.preliminaryDiagnosis
      ) {
        validationErrors.push("Chẩn đoán sơ bộ");
      }
      if (!record.diagnosis && !cleanUpdateData.diagnosis) {
        validationErrors.push("Chẩn đoán");
      }
      if (!record.treatment && !cleanUpdateData.treatment) {
        validationErrors.push("Điều trị");
      }

      if (validationErrors.length > 0) {
        res.status(400).json({
          message: "Thiếu thông tin bắt buộc khi hoàn thành hồ sơ",
          missingFields: validationErrors,
        });
        return;
      }
    }

    console.log("Attempting MongoDB update...");
    const updatedRecord = await MedicalRecord.findByIdAndUpdate(
      id,
      cleanUpdateData,
      {
        new: true,
        runValidators: true, // Enable validation
        upsert: false,
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
    console.error(
      "Error message:",
      error instanceof Error ? error.message : error
    );
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    console.error("Request params:", req.params);
    console.error("Request body keys:", Object.keys(req.body));
    console.error("Full error object:", error);

    res.status(500).json({
      message: "Lỗi cập nhật hồ sơ bệnh án",
      error: error instanceof Error ? error.message : error,
      details: process.env.NODE_ENV === "development" ? error : undefined,
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

    console.log("=== CREATE MEDICAL RECORD FROM APPOINTMENT ===");
    console.log("appointmentId:", appointmentId);
    console.log("doctorId:", doctorId);

    if (!appointmentId || !doctorId) {
      res.status(400).json({ message: "Thiếu appointmentId hoặc doctorId" });
      return;
    }

    // Kiểm tra xem đã có hồ sơ bệnh án cho appointment này chưa (Double check for safety)
    const existingRecord = await MedicalRecord.findOne({ appointmentId });
    if (existingRecord) {
      console.log("Medical record already exists:", existingRecord._id);

      // Return the existing record instead of creating duplicate
      const populatedRecord = await MedicalRecord.findById(existingRecord._id)
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
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId: doctorId,
    }).populate("patientId");

    if (!appointment) {
      res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
      return;
    }

    // Lấy thông tin bệnh nhân
    const patient = appointment.patientId as any;

    console.log("Creating new medical record...");

    // Lấy tiền sử bệnh án để tự động điền thông tin
    let previousMedicalHistory = null;
    try {
      const previousRecords = await MedicalRecord.find({
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
    } catch (historyError) {
      console.log("Could not fetch previous history:", historyError);
      // Continue without previous history
    }

    // Tạo hồ sơ bệnh án mới với thông tin cơ bản và tự động điền từ tiền sử
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

      // Tự động điền tiền sử bệnh tật từ lần khám trước
      medicalHistory: previousMedicalHistory?.medicalHistory
        ? {
            pastMedicalHistory:
              previousMedicalHistory.medicalHistory.pastMedicalHistory || "",
            surgicalHistory:
              previousMedicalHistory.medicalHistory.surgicalHistory || "",
            familyHistory:
              previousMedicalHistory.medicalHistory.familyHistory || "",
            socialHistory:
              typeof previousMedicalHistory.medicalHistory.socialHistory ===
              "string"
                ? previousMedicalHistory.medicalHistory.socialHistory
                : "",
          }
        : undefined,

      // Tự động điền yếu tố nguy cơ
      riskFactors: Array.isArray(previousMedicalHistory?.riskFactors)
        ? previousMedicalHistory.riskFactors
        : typeof previousMedicalHistory?.riskFactors === "string"
        ? [previousMedicalHistory.riskFactors]
        : [],

      // Tự động điền thông tin dị ứng và thuốc hiện tại
      quickScreening: {
        allergies:
          previousMedicalHistory?.quickScreening?.allergies ||
          (previousMedicalHistory?.allergies
            ? {
                hasAllergies: !!previousMedicalHistory.allergies,
                allergyList: previousMedicalHistory.allergies,
              }
            : {
                hasAllergies: false,
                allergyList: "",
              }),
        currentMedications:
          previousMedicalHistory?.quickScreening?.currentMedications ||
          previousMedicalHistory?.currentMedications ||
          "",

        // Tự động điền thông tin thai sản (nếu có và là nữ giới)
        pregnancyStatus:
          patient.gender === "female" &&
          previousMedicalHistory?.quickScreening?.pregnancyStatus
            ? previousMedicalHistory.quickScreening.pregnancyStatus
            : patient.gender === "female" &&
              previousMedicalHistory?.pregnancyStatus
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

    await medicalRecord.save();
    console.log("Medical record created successfully:", medicalRecord._id);

    // Populate thông tin để trả về
    const populatedRecord = await MedicalRecord.findById(medicalRecord._id)
      .populate("patient", "name email phone")
      .populate("doctor", "name specialty");

    res.status(201).json({
      message: "Tạo hồ sơ bệnh án thành công",
      record: populatedRecord,
      isExisting: false,
    });
  } catch (error: any) {
    console.error("Error creating medical record from appointment:", error);

    // If it's a duplicate key error (E11000), return the existing record
    if (error?.code === 11000 && error?.keyPattern?.appointmentId) {
      console.log("Duplicate key error, fetching existing record...");
      try {
        const existingRecord = await MedicalRecord.findOne({
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
      } catch (fetchError) {
        console.error("Error fetching existing record:", fetchError);
      }
    }

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
    const patientsWithRecords = Array.from(patientMap.values()).map(
      (patientData) => ({
        _id: patientData.patient._id,
        fullName: patientData.patient.name,
        email: patientData.patient.email,
        phone: patientData.patient.phone,
        avatar: patientData.patient.avatar,
        completedAppointments: patientData.appointments.map(
          (appointment: any) => {
            const relatedMedicalRecord = patientData.medicalRecords.find(
              (record: any) =>
                record.appointmentId &&
                record.appointmentId.toString() === appointment._id.toString()
            );

            return {
              _id: appointment._id,
              appointmentTime: appointment.appointmentTime,
              symptoms: appointment.symptoms,
              status: appointment.status,
              medicalRecord: relatedMedicalRecord
                ? {
                    _id: relatedMedicalRecord._id,
                    status: relatedMedicalRecord.status,
                    preliminaryDiagnosis:
                      relatedMedicalRecord.preliminaryDiagnosis,
                    finalDiagnosis: relatedMedicalRecord.finalDiagnosis,
                    createdAt: relatedMedicalRecord.createdAt,
                    updatedAt: relatedMedicalRecord.updatedAt,
                  }
                : undefined,
            };
          }
        ),
      })
    );

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

// Doctor: Lấy tiền sử bệnh án của bệnh nhân để tham khảo
export const getPatientMedicalHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { patientId } = req.params;
    const { doctorId } = req.query as { doctorId?: string };

    if (!patientId) {
      res.status(400).json({ message: "Thiếu patientId" });
      return;
    }

    if (!doctorId) {
      res.status(400).json({ message: "Thiếu doctorId" });
      return;
    }

    // Chỉ lấy các hồ sơ bệnh án đã hoàn thành của bệnh nhân với bác sĩ hiện tại
    const historicalRecords = await MedicalRecord.find({
      patient: patientId,
      doctor: doctorId, // Thêm điều kiện lọc theo bác sĩ
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
        gestationalWeeks: null as number | null,
      },

      // Chẩn đoán trước đây
      previousDiagnoses: [] as Array<{
        diagnosis: string;
        icdCodes: string[];
        treatment: string;
        date: string;
        doctor: string;
      }>,

      // CLS quan trọng từ các lần khám trước
      importantTests: [] as Array<{
        type: "laboratory" | "imaging";
        tests: string[];
        date: string;
        doctor: string;
      }>,

      // Vitals trend (3 lần gần nhất để so sánh)
      vitalsHistory: [] as Array<{
        date: string;
        vitals: any;
        doctor: string;
      }>,
    };

    // Xử lý từng record để tổng hợp thông tin
    historicalRecords.forEach((record, index) => {
      // Tiền sử bệnh tật - lấy từ lần khám gần nhất có thông tin
      if (
        record.medicalHistory &&
        !consolidatedHistory.medicalHistory.pastMedicalHistory
      ) {
        consolidatedHistory.medicalHistory = {
          pastMedicalHistory: record.medicalHistory.pastMedicalHistory || "",
          surgicalHistory: record.medicalHistory.surgicalHistory || "",
          familyHistory: record.medicalHistory.familyHistory || "",
          socialHistory:
            typeof record.medicalHistory.socialHistory === "string"
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
        if (record.quickScreening?.allergies) {
          consolidatedHistory.currentAllergies = {
            hasAllergies: record.quickScreening.allergies.hasAllergies || false,
            allergyList: record.quickScreening.allergies.allergyList || "",
          };
        } else if (record.allergies) {
          consolidatedHistory.currentAllergies.allergyList = record.allergies;
        }

        consolidatedHistory.currentMedications =
          record.quickScreening?.currentMedications ||
          record.currentMedications ||
          "";

        // Thai sản
        if (record.quickScreening?.pregnancyStatus) {
          consolidatedHistory.pregnancyInfo = {
            isPregnant:
              record.quickScreening.pregnancyStatus.isPregnant || false,
            isBreastfeeding:
              record.quickScreening.pregnancyStatus.isBreastfeeding || false,
            gestationalWeeks:
              record.quickScreening.pregnancyStatus.gestationalWeeks || null,
          };
        }
      }

      // Chẩn đoán trước đây
      if (record.diagnosis || record.finalDiagnosis) {
        consolidatedHistory.previousDiagnoses.push({
          diagnosis: record.finalDiagnosis || record.diagnosis || "",
          icdCodes: record.icdCodes || [],
          treatment:
            typeof record.treatment === "string" ? record.treatment : "",
          date: record.completedAt
            ? new Date(record.completedAt).toISOString()
            : record.createdAt
            ? new Date(record.createdAt).toISOString()
            : "",
          doctor: (record.doctor as any)?.name || "Unknown",
        });
      }

      // CLS quan trọng
      if (record.paraclinicalIndications) {
        if (record.paraclinicalIndications.laboratoryTests?.tests?.length) {
          consolidatedHistory.importantTests.push({
            type: "laboratory",
            tests: record.paraclinicalIndications.laboratoryTests.tests,
            date: record.completedAt
              ? new Date(record.completedAt).toISOString()
              : record.createdAt
              ? new Date(record.createdAt).toISOString()
              : "",
            doctor: (record.doctor as any)?.name || "Unknown",
          });
        }

        if (record.paraclinicalIndications.imagingStudies?.studies?.length) {
          consolidatedHistory.importantTests.push({
            type: "imaging",
            tests: record.paraclinicalIndications.imagingStudies.studies,
            date: record.completedAt
              ? new Date(record.completedAt).toISOString()
              : record.createdAt
              ? new Date(record.createdAt).toISOString()
              : "",
            doctor: (record.doctor as any)?.name || "Unknown",
          });
        }
      }

      // Vitals history (chỉ lấy 3 lần gần nhất)
      if (consolidatedHistory.vitalsHistory.length < 3) {
        // Vitals có thể có trong quickScreening hoặc legacy vitals field
        const vitals =
          record.vitals ||
          (record.quickScreening
            ? {
                temperature: (record.quickScreening as any).temperature,
                bloodPressure: (record.quickScreening as any).bloodPressure,
                heartRate: (record.quickScreening as any).heartRate,
                weight: (record.quickScreening as any).weight,
                height: (record.quickScreening as any).height,
                oxygenSaturation: (record.quickScreening as any)
                  .oxygenSaturation,
                bmi: (record.quickScreening as any).bmi,
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
            doctor: (record.doctor as any)?.name || "Unknown",
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
  } catch (error) {
    console.error("Error getting patient medical history:", error);
    res.status(500).json({
      message: "Lỗi lấy tiền sử bệnh án của bệnh nhân",
      error,
    });
  }
};
