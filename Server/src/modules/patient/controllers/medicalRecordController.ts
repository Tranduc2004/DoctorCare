import { Request, Response } from "express";
import MedicalRecord from "../models/MedicalRecord";

// Patient: Lấy hồ sơ bệnh án của bệnh nhân
export const getPatientMedicalRecords = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { patientId } = req.query as { patientId?: string };

    if (!patientId) {
      res.status(400).json({ message: "Thiếu patientId" });
      return;
    }

    // Chỉ lấy các bệnh án đã hoàn thành
    const records = await MedicalRecord.find({
      patient: patientId,
      status: "completed", // Chỉ hiển thị bệnh án đã hoàn thành
    })
      .populate("doctor", "name specialty workplace")
      .populate("patient", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy hồ sơ bệnh án", error });
  }
};

// Patient: Lấy chi tiết hồ sơ bệnh án
export const getMedicalRecordDetail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { patientId } = req.query as { patientId?: string };

    if (!patientId) {
      res.status(400).json({ message: "Thiếu patientId" });
      return;
    }

    // Chỉ cho phép xem bệnh án đã hoàn thành - trả về tất cả thông tin
    const record = await MedicalRecord.findOne({
      _id: id,
      patient: patientId,
      status: "completed", // Chỉ cho phép xem bệnh án đã hoàn thành
    })
      .populate("doctor", "name specialty workplace")
      .populate("patient", "name email phone")
      .lean(); // Sử dụng lean() để trả về plain object với tất cả fields

    if (!record) {
      res.status(404).json({
        message: "Không tìm thấy hồ sơ bệnh án hoặc bệnh án chưa hoàn thành",
      });
      return;
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy chi tiết hồ sơ bệnh án", error });
  }
};

// Patient: Lấy lịch sử khám bệnh
export const getPatientHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { patientId } = req.query as { patientId?: string };

    if (!patientId) {
      res.status(400).json({ message: "Thiếu patientId" });
      return;
    }

    // Chỉ lấy lịch sử các bệnh án đã hoàn thành
    const records = await MedicalRecord.find({
      patient: patientId,
      status: "completed", // Chỉ hiển thị bệnh án đã hoàn thành
    })
      .populate("doctor", "name specialty")
      .select("diagnosis treatment createdAt completedAt")
      .sort({ completedAt: -1 }) // Sắp xếp theo ngày hoàn thành
      .limit(10)
      .lean();

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy lịch sử khám bệnh", error });
  }
};
