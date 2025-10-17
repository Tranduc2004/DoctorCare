import { Request, Response } from "express";
import MedicalRecord from "../../patient/models/MedicalRecord";
import Patient from "../../patient/models/Patient";
import Doctor from "../../doctor/models/Doctor";

// Get all medical records with pagination and filters
export const getAllMedicalRecords = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      doctorId,
      patientId,
      startDate,
      endDate,
      search,
      consultationType,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (doctorId) {
      filter.doctor = doctorId;
    }

    if (patientId) {
      filter.patient = patientId;
    }

    if (consultationType) {
      filter.consultationType = consultationType;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate as string);
      }
    }

    // Search filter (patient name, doctor name, diagnosis)
    if (search) {
      const searchRegex = new RegExp(search as string, "i");
      filter.$or = [
        { "patientInfo.fullName": searchRegex },
        { diagnosis: searchRegex },
        { preliminaryDiagnosis: searchRegex },
        { reasonForVisit: searchRegex },
      ];
    }

    // Get records with populated data
    const records = await MedicalRecord.find(filter)
      .populate({
        path: "patient",
        select: "name email phone",
      })
      .populate({
        path: "doctor",
        select: "name email specialty workplace",
        populate: {
          path: "specialty",
          select: "name",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await MedicalRecord.countDocuments(filter);

    res.json({
      records,
      pagination: {
        current: pageNum,
        total: Math.ceil(total / limitNum),
        count: total,
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error("Error getting medical records:", error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách bệnh án" });
  }
};

// Get medical record by ID with full details
export const getMedicalRecordById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const record = await MedicalRecord.findById(id)
      .populate({
        path: "patient",
        select: "name email phone address birthYear gender",
      })
      .populate({
        path: "doctor",
        select: "name email specialty workplace phone",
        populate: {
          path: "specialty",
          select: "name description",
        },
      });

    if (!record) {
      return res.status(404).json({ error: "Không tìm thấy bệnh án" });
    }

    res.json(record);
  } catch (error) {
    console.error("Error getting medical record:", error);
    res.status(500).json({ error: "Lỗi khi lấy thông tin bệnh án" });
  }
};

// Get medical records statistics
export const getMedicalRecordsStats = async (req: Request, res: Response) => {
  try {
    const { period = "month" } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Total records
    const totalRecords = await MedicalRecord.countDocuments();

    // Records in period
    const recordsInPeriod = await MedicalRecord.countDocuments({
      createdAt: { $gte: startDate },
    });

    // Completed records
    const completedRecords = await MedicalRecord.countDocuments({
      status: "completed",
    });

    // Draft records
    const draftRecords = await MedicalRecord.countDocuments({
      status: "draft",
    });

    // Records by consultation type
    const onlineRecords = await MedicalRecord.countDocuments({
      consultationType: "online",
    });

    const offlineRecords = await MedicalRecord.countDocuments({
      consultationType: "offline",
    });

    // Records by day in period (for charts)
    const recordsByDay = await MedicalRecord.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Most active doctors
    const topDoctors = await MedicalRecord.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$doctor",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "doctors",
          localField: "_id",
          foreignField: "_id",
          as: "doctor",
        },
      },
      {
        $unwind: "$doctor",
      },
      {
        $project: {
          count: 1,
          "doctor.name": 1,
          "doctor.specialty": 1,
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    res.json({
      overview: {
        totalRecords,
        recordsInPeriod,
        completedRecords,
        draftRecords,
        onlineRecords,
        offlineRecords,
      },
      charts: {
        recordsByDay,
        topDoctors,
      },
    });
  } catch (error) {
    console.error("Error getting medical records stats:", error);
    res.status(500).json({ error: "Lỗi khi lấy thống kê bệnh án" });
  }
};

// Delete medical record (admin only)
export const deleteMedicalRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const record = await MedicalRecord.findById(id);
    if (!record) {
      return res.status(404).json({ error: "Không tìm thấy bệnh án" });
    }

    await MedicalRecord.findByIdAndDelete(id);

    res.json({ message: "Đã xóa bệnh án thành công" });
  } catch (error) {
    console.error("Error deleting medical record:", error);
    res.status(500).json({ error: "Lỗi khi xóa bệnh án" });
  }
};

// Update medical record status (admin only)
export const updateMedicalRecordStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["draft", "completed", "archived"].includes(status)) {
      return res.status(400).json({ error: "Trạng thái không hợp lệ" });
    }

    const record = await MedicalRecord.findById(id);
    if (!record) {
      return res.status(404).json({ error: "Không tìm thấy bệnh án" });
    }

    record.status = status;
    if (status === "completed" && !record.completedAt) {
      record.completedAt = new Date();
    }

    await record.save();

    res.json({ message: "Đã cập nhật trạng thái bệnh án", record });
  } catch (error) {
    console.error("Error updating medical record status:", error);
    res.status(500).json({ error: "Lỗi khi cập nhật trạng thái bệnh án" });
  }
};

// Get medical records by patient
export const getMedicalRecordsByPatient = async (
  req: Request,
  res: Response
) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const records = await MedicalRecord.find({ patient: patientId })
      .populate({
        path: "doctor",
        select: "name specialty",
        populate: {
          path: "specialty",
          select: "name",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await MedicalRecord.countDocuments({ patient: patientId });

    res.json({
      records,
      pagination: {
        current: pageNum,
        total: Math.ceil(total / limitNum),
        count: total,
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error("Error getting patient medical records:", error);
    res.status(500).json({ error: "Lỗi khi lấy bệnh án của bệnh nhân" });
  }
};

// Get medical records by doctor
export const getMedicalRecordsByDoctor = async (
  req: Request,
  res: Response
) => {
  try {
    const { doctorId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const records = await MedicalRecord.find({ doctor: doctorId })
      .populate({
        path: "patient",
        select: "name email phone",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await MedicalRecord.countDocuments({ doctor: doctorId });

    res.json({
      records,
      pagination: {
        current: pageNum,
        total: Math.ceil(total / limitNum),
        count: total,
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error("Error getting doctor medical records:", error);
    res.status(500).json({ error: "Lỗi khi lấy bệnh án của bác sĩ" });
  }
};
