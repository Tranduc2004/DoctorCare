import { Request, Response } from "express";
import MedicalRecord from "../../patient/models/MedicalRecord";

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

    // Kiểm tra xem hồ sơ có thuộc về bác sĩ này không
    const record = await MedicalRecord.findOne({ _id: id, doctor: doctorId });
    if (!record) {
      res.status(404).json({ message: "Không tìm thấy hồ sơ bệnh án" });
      return;
    }

    const updatedRecord = await MedicalRecord.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate("patient doctor", "name email");

    res.json(updatedRecord);
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật hồ sơ bệnh án", error });
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
