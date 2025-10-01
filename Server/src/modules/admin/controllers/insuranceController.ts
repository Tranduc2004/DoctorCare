import { Request, Response } from "express";
import mongoose from "mongoose";
import Insurance from "../../patient/models/Insurance";
import PatientProfile from "../../patient/models/PatientProfile";

export const getInsuranceVerifications = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      status = "pending",
      page = 1,
      limit = 10,
      search,
    } = req.query as {
      status?: string;
      page?: number;
      limit?: number;
      search?: string;
    };

    const query: any = {};

    // Filter by verification status
    if (status !== "all") {
      query.verificationStatus = status;
    }

    // Search by policy number or patient name
    if (search) {
      query.$or = [
        { policyNumber: new RegExp(search, "i") },
        { "patientProfile.fullName": new RegExp(search, "i") },
      ];
    }

    const [insurances, total] = await Promise.all([
      Insurance.find(query)
        .populate("patientId", "name email phone")
        .skip((+page - 1) * +limit)
        .limit(+limit)
        .sort({ submittedAt: -1 })
        .lean(),
      Insurance.countDocuments(query),
    ]);

    // Get patient profiles for more details
    const patientIds = insurances.map((ins) => ins.patientId);
    const profiles = await PatientProfile.find({
      patientId: { $in: patientIds },
    }).lean();

    const profileMap = profiles.reduce((acc, profile) => {
      acc[profile.patientId.toString()] = profile;
      return acc;
    }, {} as Record<string, any>);

    // Combine insurance data with profile data
    const enrichedInsurances = insurances.map((insurance) => {
      const patientData = insurance.patientId as any; // Cast to any since we populated it
      const profileData = profileMap[insurance.patientId.toString()];

      console.log("Insurance data:", insurance);
      console.log("Image URL:", insurance.imageUrl);

      return {
        ...insurance,
        patient: {
          _id: insurance.patientId,
          name: patientData?.name || profileData?.fullName || "N/A",
          email: patientData?.email || profileData?.email || "N/A",
          phone: patientData?.phone || profileData?.phone || "N/A",
        },
      };
    });

    res.json({
      insurances: enrichedInsurances,
      total,
      pages: Math.ceil(total / +limit),
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách yêu cầu xác thực BHYT",
      error,
    });
  }
};

export const verifyInsurance = async (req: Request, res: Response) => {
  try {
    const { insuranceId } = req.params;
    const { verificationStatus, rejectionReason } = req.body as {
      verificationStatus: "approved" | "rejected";
      rejectionReason?: string;
    };
    const adminId = (req as any).adminId;

    console.log("Verify insurance request:", {
      insuranceId,
      verificationStatus,
      rejectionReason,
      adminId,
    });

    if (!adminId) {
      return res.status(401).json({ message: "Admin ID không tồn tại" });
    }

    // Convert string to ObjectId
    const adminObjectId = new mongoose.Types.ObjectId(adminId);

    const insurance = await Insurance.findById(insuranceId);
    if (!insurance) {
      return res.status(404).json({ message: "Không tìm thấy thông tin BHYT" });
    }

    console.log("Found insurance:", insurance);

    // Update verification status
    insurance.verificationStatus =
      verificationStatus === "approved" ? "verified" : "rejected";
    insurance.verifiedAt = new Date();
    insurance.verifiedBy = adminObjectId;
    insurance.verificationNotes =
      verificationStatus === "approved"
        ? "Đã được admin phê duyệt"
        : rejectionReason;
    if (verificationStatus === "rejected") {
      insurance.rejectionReason = rejectionReason;
    }

    // Add to audit log
    insurance.auditLog = insurance.auditLog || [];
    insurance.auditLog.push({
      action: `insurance_${verificationStatus}`,
      timestamp: new Date(),
      userId: adminObjectId,
      details:
        verificationStatus === "approved"
          ? "Đã được admin phê duyệt"
          : rejectionReason,
    });

    await insurance.save();
    console.log("Insurance saved successfully");

    // If verifying, also update patient profile status
    if (verificationStatus === "approved") {
      try {
        await PatientProfile.findOneAndUpdate(
          { patientId: insurance.patientId },
          {
            $set: {
              profileStatus: "verified",
              verifiedAt: new Date(),
              verifiedBy: adminObjectId,
            },
            $push: {
              auditLog: {
                action: "profile_verified",
                timestamp: new Date(),
                userId: adminObjectId,
                details: "Xác thực qua BHYT",
              },
            },
          }
        );
        console.log("Patient profile updated successfully");
      } catch (profileError) {
        console.error("Error updating patient profile:", profileError);
        // Don't fail the whole operation if profile update fails
      }
    }

    res.json({
      ...insurance,
      message:
        verificationStatus === "approved"
          ? "BHYT đã được phê duyệt thành công"
          : "BHYT đã bị từ chối",
    });
  } catch (error) {
    console.error("Error in verifyInsurance:", error);
    res.status(500).json({
      message: "Lỗi khi xác thực BHYT",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Get verification history for an insurance record
export const getVerificationHistory = async (req: Request, res: Response) => {
  try {
    const { insuranceId } = req.params;

    const insurance = await Insurance.findById(insuranceId)
      .populate("verifiedBy", "username")
      .populate("submittedBy", "name email")
      .populate("lastEditedBy", "name email")
      .populate("auditLog.userId", "name email username")
      .lean();

    if (!insurance) {
      return res.status(404).json({ message: "Không tìm thấy thông tin BHYT" });
    }

    res.json(insurance);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy lịch sử xác thực",
      error,
    });
  }
};

// Update insurance verification expiry
export const updateInsuranceExpiry = async (req: Request, res: Response) => {
  try {
    const { insuranceId } = req.params;
    const adminId = (req as any).adminId;
    const { validTo, notes } = req.body as {
      validTo: string; // YYYY-MM-DD
      notes?: string;
    };

    if (!adminId) {
      return res.status(401).json({ message: "Admin ID không tồn tại" });
    }

    const adminObjectId = new mongoose.Types.ObjectId(adminId);

    const insurance = await Insurance.findById(insuranceId);
    if (!insurance) {
      return res.status(404).json({ message: "Không tìm thấy thông tin BHYT" });
    }

    insurance.validTo = validTo;
    insurance.lastEditedBy = adminObjectId;
    insurance.verificationNotes = notes;

    // Add to audit log
    insurance.auditLog = insurance.auditLog || [];
    insurance.auditLog.push({
      action: "update_expiry",
      timestamp: new Date(),
      userId: adminObjectId,
      details: `Cập nhật hạn BHYT: ${validTo}${notes ? ` - ${notes}` : ""}`,
    });

    // Check if insurance has expired
    const today = new Date();
    const expiryDate = new Date(validTo);
    if (expiryDate < today) {
      insurance.verificationStatus = "expired";
    }

    await insurance.save();
    res.json(insurance);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi cập nhật hạn BHYT",
      error,
    });
  }
};
