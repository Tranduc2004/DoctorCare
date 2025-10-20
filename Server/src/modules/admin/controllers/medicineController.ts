import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import {
  MedicineService,
  ApiResponse,
  CreateMedicineDTO,
  MedicineQuery,
  PaginationResult,
  ValidationError,
  NotFoundError,
  DuplicateError,
} from "@medicare/shared";
import { MedicineModel, MedicineStockModel } from "../../../models/medicine";
import { CategoryModel } from "../../../models/category";

// Note: MongoDB connection is expected to be established by the server startup
// (configured via environment/.env). Controllers should not call mongoose.connect.

function getRequestId(req: Request) {
  return (req.headers["x-request-id"] as string) || undefined;
}

export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const isAdmin = user && (user.role === "admin" || user.isAdmin === true);
  if (!isAdmin) {
    return res.status(403).json({ success: false, error: "Forbidden" } as any);
  }
  return next();
};

export const getPendingMedicines = async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    // Validate pagination
    const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
    let limit = parseInt((req.query.limit as string) || "20", 10);
    if (Number.isNaN(limit)) limit = 20;
    limit = Math.min(Math.max(1, limit), 100);

    // Use MedicineService.getAllMedicines to retrieve pending medicines
    const query: MedicineQuery = {
      status: "pending",
      page,
      limit,
      sortBy: "createdAt",
      sortOrder: "desc",
    };
    const result = await MedicineService.getAllMedicines(MedicineModel, query);
    const response: ApiResponse<PaginationResult<any>> = {
      success: true,
      data: {
        data: result.medicines,
        pagination: result.pagination,
      },
      message: "Pending medicines retrieved successfully",
    };

    res.status(200).json(response);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || "Failed to get pending medicines",
    } as any);
  }
};

export const approveMedicine = async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(404)
        .json({ success: false, error: "Medicine not found" } as any);
    }

    const adminId = (req as any).admin?.id || (req as any).adminId || "admin";
    const adminName =
      (req as any).admin?.username || (req as any).adminUsername || "admin";

    // MedicineModel is already imported from local models
    const medicine = await MedicineModel.findById(id);
    if (!medicine) {
      return res
        .status(404)
        .json({ success: false, error: "Medicine not found" } as any);
    }

    medicine.status = "active";
    medicine.isActive = true;
    medicine.updatedBy = adminId;
    medicine.updatedByName = adminName;
    medicine.updatedAt = new Date();
    await medicine.save();

    // Ensure MedicineStock exists
    // MedicineStockModel is already imported from local models
    const medIdStr = medicine._id.toString();
    let stock = await MedicineStockModel.findOne({ medicineId: medIdStr });
    if (!stock) {
      stock = new MedicineStockModel({
        medicineId: medIdStr,
        medicineName: medicine.name,
        medicineCode: medicine.code,
        totalQuantity: 0,
        availableQuantity: 0,
        reservedQuantity: 0,
        minStockLevel: (medicine as any).minStockLevel || 0,
        maxStockLevel: (medicine as any).maxStockLevel || 1000,
        reorderLevel: (medicine as any).reorderLevel || 50,
        averageCostPerTablet: 0,
        totalStockValue: 0,
        stockStatus: "out_of_stock",
        lastUpdated: new Date(),
        lastUpdatedBy: adminId,
        lastUpdatedByName: adminName,
      });
      await stock!.save();
    }

    return res.status(200).json({ success: true, data: medicine } as any);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || "Failed to approve medicine",
    } as any);
  }
};

export const rejectMedicine = async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    if (!reason || String(reason).trim() === "") {
      return res
        .status(400)
        .json({ success: false, error: "reason is required" } as any);
    }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(404)
        .json({ success: false, error: "Medicine not found" } as any);
    }

    const adminId = (req as any).admin?.id || (req as any).adminId || "admin";
    const adminName =
      (req as any).admin?.username || (req as any).adminUsername || "admin";

    // MedicineModel is already imported from local models
    const medicine = await MedicineModel.findById(id);
    if (!medicine) {
      return res
        .status(404)
        .json({ success: false, error: "Medicine not found" } as any);
    }

    medicine.status = "inactive";
    medicine.isActive = false;
    medicine.rejectedReason = reason || "Rejected by admin";
    medicine.updatedBy = adminId;
    medicine.updatedByName = adminName;
    medicine.updatedAt = new Date();
    await medicine.save();

    return res.status(200).json({ success: true, data: medicine } as any);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || "Failed to reject medicine",
    } as any);
  }
};

/**
 * Lấy tất cả thuốc (admin quản lý)
 */
export const getAllMedicines = async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    // Validate pagination
    const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
    let limit = parseInt((req.query.limit as string) || "20", 10);
    if (Number.isNaN(limit)) limit = 20;
    limit = Math.min(Math.max(1, limit), 100);

    const query: MedicineQuery = {
      search: req.query.search as string,
      categoryId: req.query.categoryId as string,
      status: req.query.status as any,
      requiresPrescription: req.query.requiresPrescription === "true",
      manufacturer: req.query.manufacturer as string,
      stockStatus: req.query.stockStatus as any,
      createdBy: req.query.createdBy as string,
      createdByRole: req.query.createdByRole as any,
      page,
      limit,
      sortBy: (req.query.sortBy as string) || "createdAt",
      sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
    };

    const result = await MedicineService.getAllMedicines(MedicineModel, query);

    const response: ApiResponse<PaginationResult<any>> = {
      success: true,
      data: {
        data: result.medicines,
        pagination: result.pagination,
      },
      message: "Medicines retrieved successfully",
    };

    res.status(200).json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      error: error?.message || "Failed to get medicines",
    };
    res.status(500).json(response);
  }
};

/**
 * Tạo thuốc mới (admin)
 */
export const createMedicine = async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const adminId = (req as any).admin?.id || (req as any).adminId || "admin";
    const adminName =
      (req as any).admin?.username || (req as any).adminUsername || "admin";

    const medicineData: CreateMedicineDTO = req.body;

    const medicine = await MedicineService.createMedicine(
      MedicineModel,
      MedicineStockModel,
      medicineData,
      adminId,
      adminName,
      "admin",
      CategoryModel
    );

    const response: ApiResponse = {
      success: true,
      data: medicine,
      message: "Medicine created successfully",
    };

    res.status(201).json(response);
  } catch (error: any) {
    let status = 500;
    if (error instanceof ValidationError) {
      status = 400;
    } else if (error instanceof DuplicateError) {
      status = 409;
    }

    const response: ApiResponse = {
      success: false,
      error: error?.message || "Failed to create medicine",
    };
    res.status(status).json(response);
  }
};

/**
 * Lấy chi tiết thuốc theo ID
 */
export const getMedicineById = async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid medicine ID" } as any);
    }

    const medicine = await MedicineModel.findById(id);
    if (!medicine) {
      return res
        .status(404)
        .json({ success: false, error: "Medicine not found" } as any);
    }

    const response: ApiResponse = {
      success: true,
      data: medicine,
      message: "Medicine retrieved successfully",
    };

    res.status(200).json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      error: error?.message || "Failed to get medicine",
    };
    res.status(500).json(response);
  }
};

/**
 * Cập nhật thuốc
 */
export const updateMedicine = async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid medicine ID" } as any);
    }

    const adminId = (req as any).admin?.id || (req as any).adminId || "admin";
    const adminName =
      (req as any).admin?.username || (req as any).adminUsername || "admin";

    const medicine = await MedicineService.updateMedicine(
      MedicineModel,
      id,
      updateData,
      adminId,
      adminName
    );

    const response: ApiResponse = {
      success: true,
      data: medicine,
      message: "Medicine updated successfully",
    };

    res.status(200).json(response);
  } catch (error: any) {
    let status = 500;
    if (error instanceof ValidationError) {
      status = 400;
    } else if (error instanceof NotFoundError) {
      status = 404;
    } else if (error instanceof DuplicateError) {
      status = 409;
    }

    const response: ApiResponse = {
      success: false,
      error: error?.message || "Failed to update medicine",
    };
    res.status(status).json(response);
  }
};

/**
 * Xóa thuốc (soft delete)
 */
export const deleteMedicine = async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid medicine ID" } as any);
    }

    const adminId = (req as any).admin?.id || (req as any).adminId || "admin";
    const adminName =
      (req as any).admin?.username || (req as any).adminUsername || "admin";

    const result = await MedicineService.deleteMedicine(
      MedicineModel,
      id,
      adminId,
      adminName
    );

    const response: ApiResponse = {
      success: true,
      data: result,
      message: "Medicine deleted successfully",
    };

    res.status(200).json(response);
  } catch (error: any) {
    let status = 500;
    if (error instanceof NotFoundError) {
      status = 404;
    }

    const response: ApiResponse = {
      success: false,
      error: error?.message || "Failed to delete medicine",
    };
    res.status(status).json(response);
  }
};

/**
 * Lấy thống kê thuốc
 */
export const getMedicineStatistics = async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const stats = await MedicineService.getStockStatistics(
      MedicineStockModel,
      MedicineModel
    );

    const response: ApiResponse = {
      success: true,
      data: stats,
      message: "Medicine statistics retrieved successfully",
    };

    res.status(200).json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      error: error?.message || "Failed to get medicine statistics",
    };
    res.status(500).json(response);
  }
};
