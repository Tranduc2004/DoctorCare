import { Request, Response } from "express";
import PatientProfile from "../models/PatientProfile";
import Insurance from "../models/Insurance";

export const getProfile = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.query as { patientId?: string };
    if (!patientId) return res.status(400).json({ message: "Thiếu patientId" });
    const profile = await PatientProfile.findOne({ patientId }).lean();
    const insurance = await Insurance.findOne({ patientId }).lean();
    res.json({ profile, insurance });
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy hồ sơ", error });
  }
};

export const upsertProfile = async (req: Request, res: Response) => {
  try {
    const { patientId, profile } = req.body as {
      patientId?: string;
      profile?: any;
    };
    if (!patientId) return res.status(400).json({ message: "Thiếu patientId" });
    const sanitized = { ...(profile || {}) };
    // Normalize numeric fields
    if (sanitized.heightCm != null)
      sanitized.heightCm = Number(sanitized.heightCm);
    if (sanitized.weightKg != null)
      sanitized.weightKg = Number(sanitized.weightKg);

    const doc = await PatientProfile.findOneAndUpdate(
      { patientId },
      { $set: { ...sanitized, patientId } },
      { new: true, upsert: true }
    );
    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lưu hồ sơ", error });
  }
};

export const upsertInsurance = async (req: Request, res: Response) => {
  try {
    const { patientId, insurance } = req.body as {
      patientId?: string;
      insurance?: any;
    };
    if (!patientId) return res.status(400).json({ message: "Thiếu patientId" });
    const doc = await Insurance.findOneAndUpdate(
      { patientId },
      { $set: { ...insurance, patientId } },
      { new: true, upsert: true }
    );
    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lưu BHYT", error });
  }
};
