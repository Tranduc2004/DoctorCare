import { Request, Response } from "express";
import MedicalRecord from "../models/MedicalRecord";

// Patient: Lấy danh sách đơn thuốc từ bệnh án
export const getPatientPrescriptions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      patientId,
      page = 1,
      limit = 10,
    } = req.query as {
      patientId?: string;
      page?: string;
      limit?: string;
    };

    if (!patientId) {
      res.status(400).json({ message: "Thiếu patientId" });
      return;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Lấy các bệnh án có đơn thuốc
    const records = await MedicalRecord.find({
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
    const prescriptions = records.map((record: any) => {
      // Determine medications source
      let medications: any[] = [];

      if (record.prescription?.medications?.length > 0) {
        medications = record.prescription.medications;
      } else if (
        typeof record.treatment === "object" &&
        record.treatment?.medicationsList?.length > 0
      ) {
        // Convert medicationsList format to prescription format
        medications = record.treatment.medicationsList.map((med: any) => ({
          name: med.drugName,
          strength: med.strength,
          form: med.form,
          dosage: med.dosage,
          frequency: med.frequency?.toString() || "1",
          duration: med.duration,
          quantity: med.quantity,
          instructions: med.instructions,
        }));
      }

      return {
        _id: `${record._id}_prescription`,
        recordId: record._id,
        patientId: record.patient._id,
        doctorId: record.doctor._id,
        appointmentId: record.appointment,
        medications,
        notes: record.prescription?.notes || "",
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
    const total = await MedicalRecord.countDocuments({
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
  } catch (error) {
    console.error("Error fetching patient prescriptions:", error);
    res.status(500).json({ message: "Lỗi lấy danh sách đơn thuốc", error });
  }
};

// Patient: Lấy chi tiết đơn thuốc
export const getPrescriptionDetail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { prescriptionId } = req.params as { prescriptionId: string };
    const { patientId } = req.query as { patientId?: string };

    if (!patientId) {
      res.status(400).json({ message: "Thiếu patientId" });
      return;
    }

    // Extract record ID from prescription ID
    const recordId = prescriptionId.replace("_prescription", "");

    const record = await MedicalRecord.findOne({
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
    let medications: any[] = [];

    if ((record as any).prescription?.medications?.length > 0) {
      medications = (record as any).prescription.medications;
    } else if (
      typeof (record as any).treatment === "object" &&
      (record as any).treatment?.medicationsList?.length > 0
    ) {
      medications = (record as any).treatment.medicationsList.map(
        (med: any) => ({
          name: med.drugName,
          strength: med.strength,
          form: med.form,
          dosage: med.dosage,
          frequency: med.frequency?.toString() || "1",
          duration: med.duration,
          quantity: med.quantity,
          instructions: med.instructions,
        })
      );
    }

    const prescription = {
      _id: prescriptionId,
      recordId: (record as any)._id,
      patientId: (record as any).patient._id,
      doctorId: (record as any).doctor._id,
      appointmentId: (record as any).appointment,
      medications,
      notes: (record as any).prescription?.notes || "",
      prescriptionDate:
        (record as any).prescriptionIssuedAt || (record as any).createdAt,
      status:
        (record as any).status === "completed"
          ? "active"
          : (record as any).status,
      doctor: {
        _id: (record as any).doctor._id,
        name: (record as any).doctor.name,
        specialty: (record as any).doctor.specialty,
        workplace: (record as any).doctor.workplace,
        phone: (record as any).doctor.phone,
      },
      patient: (record as any).patient,
      medicalRecord: {
        _id: (record as any)._id,
        diagnosis:
          (record as any).diagnosis || (record as any).preliminaryDiagnosis,
        preliminaryDiagnosis: (record as any).preliminaryDiagnosis,
        consultationType: (record as any).consultationType,
        createdAt: (record as any).createdAt,
      },
    };

    res.json(prescription);
  } catch (error) {
    console.error("Error fetching prescription detail:", error);
    res.status(500).json({ message: "Lỗi lấy chi tiết đơn thuốc", error });
  }
};

// Patient: Tìm kiếm đơn thuốc
export const searchPrescriptions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      patientId,
      query,
      page = 1,
      limit = 10,
    } = req.query as {
      patientId?: string;
      query?: string;
      page?: string;
      limit?: string;
    };

    if (!patientId || !query) {
      res.status(400).json({ message: "Thiếu patientId hoặc query" });
      return;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
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

    const records = await MedicalRecord.find(searchFilter)
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
    const prescriptions = records.map((record: any) => {
      let medications: any[] = [];

      if (record.prescription?.medications?.length > 0) {
        medications = record.prescription.medications;
      } else if (
        typeof record.treatment === "object" &&
        record.treatment?.medicationsList?.length > 0
      ) {
        medications = record.treatment.medicationsList.map((med: any) => ({
          name: med.drugName,
          strength: med.strength,
          form: med.form,
          dosage: med.dosage,
          frequency: med.frequency?.toString() || "1",
          duration: med.duration,
          quantity: med.quantity,
          instructions: med.instructions,
        }));
      }

      return {
        _id: `${record._id}_prescription`,
        recordId: record._id,
        patientId: record.patient._id,
        doctorId: record.doctor._id,
        appointmentId: record.appointment,
        medications,
        notes: record.prescription?.notes || "",
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

    const total = await MedicalRecord.countDocuments(searchFilter);

    res.json({
      prescriptions,
      pagination: {
        current: pageNum,
        total: Math.ceil(total / limitNum),
        count: total,
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error("Error searching prescriptions:", error);
    res.status(500).json({ message: "Lỗi tìm kiếm đơn thuốc", error });
  }
};

// Patient: Lấy đơn thuốc theo khoảng thời gian
export const getPrescriptionsByDateRange = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      patientId,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query as {
      patientId?: string;
      startDate?: string;
      endDate?: string;
      page?: string;
      limit?: string;
    };

    if (!patientId || !startDate || !endDate) {
      res
        .status(400)
        .json({ message: "Thiếu patientId, startDate hoặc endDate" });
      return;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
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

    const records = await MedicalRecord.find(filter)
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
    const prescriptions = records.map((record: any) => {
      let medications: any[] = [];

      if (record.prescription?.medications?.length > 0) {
        medications = record.prescription.medications;
      } else if (
        typeof record.treatment === "object" &&
        record.treatment?.medicationsList?.length > 0
      ) {
        medications = record.treatment.medicationsList.map((med: any) => ({
          name: med.drugName,
          strength: med.strength,
          form: med.form,
          dosage: med.dosage,
          frequency: med.frequency?.toString() || "1",
          duration: med.duration,
          quantity: med.quantity,
          instructions: med.instructions,
        }));
      }

      return {
        _id: `${record._id}_prescription`,
        recordId: record._id,
        patientId: record.patient._id,
        doctorId: record.doctor._id,
        appointmentId: record.appointment,
        medications,
        notes: record.prescription?.notes || "",
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

    const total = await MedicalRecord.countDocuments(filter);

    res.json({
      prescriptions,
      pagination: {
        current: pageNum,
        total: Math.ceil(total / limitNum),
        count: total,
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error("Error fetching prescriptions by date range:", error);
    res
      .status(500)
      .json({ message: "Lỗi lấy đơn thuốc theo thời gian", error });
  }
};

// Patient: Lấy đơn thuốc theo trạng thái
export const getPrescriptionsByStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      patientId,
      status,
      page = 1,
      limit = 10,
    } = req.query as {
      patientId?: string;
      status?: string;
      page?: string;
      limit?: string;
    };

    if (!patientId || !status) {
      res.status(400).json({ message: "Thiếu patientId hoặc status" });
      return;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Map status for medical records
    let recordStatus = "completed";
    if (status === "cancelled") {
      recordStatus = "cancelled";
    } else if (status === "completed") {
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

    const records = await MedicalRecord.find(filter)
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
    const prescriptions = records.map((record: any) => {
      let medications: any[] = [];

      if (record.prescription?.medications?.length > 0) {
        medications = record.prescription.medications;
      } else if (
        typeof record.treatment === "object" &&
        record.treatment?.medicationsList?.length > 0
      ) {
        medications = record.treatment.medicationsList.map((med: any) => ({
          name: med.drugName,
          strength: med.strength,
          form: med.form,
          dosage: med.dosage,
          frequency: med.frequency?.toString() || "1",
          duration: med.duration,
          quantity: med.quantity,
          instructions: med.instructions,
        }));
      }

      return {
        _id: `${record._id}_prescription`,
        recordId: record._id,
        patientId: record.patient._id,
        doctorId: record.doctor._id,
        appointmentId: record.appointment,
        medications,
        notes: record.prescription?.notes || "",
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

    const total = await MedicalRecord.countDocuments(filter);

    res.json({
      prescriptions,
      pagination: {
        current: pageNum,
        total: Math.ceil(total / limitNum),
        count: total,
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error("Error fetching prescriptions by status:", error);
    res
      .status(500)
      .json({ message: "Lỗi lấy đơn thuốc theo trạng thái", error });
  }
};
