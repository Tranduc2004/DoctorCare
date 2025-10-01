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

    console.log("Saving insurance data:", insurance);
    console.log("Image URL:", insurance?.imageUrl);

    // Always set verification status to pending when patient submits/updates
    const insuranceData = {
      ...insurance,
      patientId,
      verificationStatus: "pending", // Always require admin verification
      submittedAt: new Date(),
      submittedBy: patientId, // Patient submitted this
    };

    const doc = await Insurance.findOneAndUpdate(
      { patientId },
      { $set: insuranceData },
      { new: true, upsert: true }
    );

    console.log("Saved insurance doc:", doc);

    res.json({
      ...doc,
      message:
        "Thông tin BHYT đã được gửi chờ duyệt. Admin sẽ xem xét và phê duyệt trong thời gian sớm nhất.",
    });
  } catch (error) {
    console.error("Error saving insurance:", error);
    res.status(500).json({ message: "Lỗi lưu BHYT", error });
  }
};

// Sync patient profile data from medical record
export const syncFromMedicalRecord = async (req: Request, res: Response) => {
  try {
    const { patientId, medicalRecordData, doctorId } = req.body as {
      patientId?: string;
      medicalRecordData?: any;
      doctorId?: string;
    };

    if (!patientId) return res.status(400).json({ message: "Thiếu patientId" });
    if (!medicalRecordData) return res.status(400).json({ message: "Thiếu dữ liệu medical record" });
    if (!doctorId) return res.status(400).json({ message: "Thiếu doctorId" });

    // Extract relevant fields from medical record to sync with patient profile
    const profileUpdateData: any = {};

    // Basic administrative info
    if (medicalRecordData.administrativeSnapshot?.fullName) {
      profileUpdateData.fullName = medicalRecordData.administrativeSnapshot.fullName;
    }
    if (medicalRecordData.administrativeSnapshot?.birthYear) {
      // Convert birth year to DOB format (YYYY-01-01)
      profileUpdateData.dob = `${medicalRecordData.administrativeSnapshot.birthYear}-01-01`;
    }
    if (medicalRecordData.administrativeSnapshot?.gender) {
      profileUpdateData.gender = medicalRecordData.administrativeSnapshot.gender;
    }
    if (medicalRecordData.administrativeSnapshot?.phone) {
      profileUpdateData.phone = medicalRecordData.administrativeSnapshot.phone;
    }

    // Emergency contact
    if (medicalRecordData.administrativeSnapshot?.emergencyContact) {
      const emergencyContact = medicalRecordData.administrativeSnapshot.emergencyContact;
      if (emergencyContact.name) {
        profileUpdateData.emergencyContactName = emergencyContact.name;
      }
      if (emergencyContact.phone) {
        profileUpdateData.emergencyContactPhone = emergencyContact.phone;
      }
      if (emergencyContact.relation) {
        profileUpdateData.emergencyContactRelation = emergencyContact.relation;
      }
    }

    // Medical information from quick screening
    if (medicalRecordData.quickScreening?.allergies) {
      profileUpdateData.allergies = medicalRecordData.quickScreening.allergies;
    }
    if (medicalRecordData.quickScreening?.currentMedications) {
      profileUpdateData.medications = medicalRecordData.quickScreening.currentMedications;
    }

    // Vitals - update height and weight if provided
    if (medicalRecordData.quickScreening?.vitals?.height) {
      profileUpdateData.heightCm = Number(medicalRecordData.quickScreening.vitals.height);
    }
    if (medicalRecordData.quickScreening?.vitals?.weight) {
      profileUpdateData.weightKg = Number(medicalRecordData.quickScreening.vitals.weight);
    }

    // Add audit log entry
    const auditEntry = {
      action: "sync_from_medical_record",
      timestamp: new Date(),
      userId: doctorId,
      details: "Đồng bộ thông tin từ hồ sơ khám bệnh"
    };

    // Update patient profile
    const updatedProfile = await PatientProfile.findOneAndUpdate(
      { patientId },
      { 
        $set: { 
          ...profileUpdateData, 
          lastEditedBy: doctorId 
        },
        $push: { auditLog: auditEntry }
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Đã đồng bộ thông tin bệnh nhân từ hồ sơ khám bệnh",
      updatedProfile,
      syncedFields: Object.keys(profileUpdateData)
    });

  } catch (error) {
    console.error("Error syncing profile from medical record:", error);
    res.status(500).json({ message: "Lỗi đồng bộ hồ sơ", error });
  }
};
