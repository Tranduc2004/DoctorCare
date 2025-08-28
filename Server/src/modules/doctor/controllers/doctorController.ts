import { Request, Response } from "express";
import Doctor from "../models/Doctor";

// Lấy danh sách bác sĩ theo chuyên khoa
export const getDoctorsBySpecialty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { specialty } = req.query as { specialty?: string };

    let query = {};
    if (specialty) {
      query = { specialty: specialty };
    }

    const doctors = await Doctor.find(query)
      .select("_id name specialty workplace experience")
      .sort({ name: 1 })
      .lean();

    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách bác sĩ", error });
  }
};

// Lấy thông tin chi tiết một bác sĩ
export const getDoctorById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    const doctor = await Doctor.findById(id).select("-password").lean();

    if (!doctor) {
      res.status(404).json({ message: "Không tìm thấy bác sĩ" });
      return;
    }

    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy thông tin bác sĩ", error });
  }
};

// Lấy tất cả bác sĩ (cho admin)
export const getAllDoctors = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const doctors = await Doctor.find()
      .select("_id name email specialty workplace experience license")
      .sort({ name: 1 })
      .lean();

    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách bác sĩ", error });
  }
};
