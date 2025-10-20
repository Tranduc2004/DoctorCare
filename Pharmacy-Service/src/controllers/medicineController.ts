import { Request, Response } from "express";
import {
  ApiResponse,
  MedicineService,
  CreateMedicineDTO,
  MedicineImportDTO,
  MedicineQuery,
  UnitConverter,
  PaginationResult,
} from "@medicare/shared";
import { CategoryModel } from "../models/category";
import mongoose from "mongoose";
import {
  MedicineModel,
  MedicineBatchModel,
  StockTransactionModel,
  MedicineStockModel,
} from "../models/Medicine";

/**
 * Medicine Controller for Pharmacy Staff
 * Sử dụng MedicineService để đảm bảo logic nghiệp vụ nhất quán
 */

/**
 * Tạo thuốc mới
 */
export const createMedicine = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const staffId = (req as any).staff?.id;
    const staffName = (req as any).staff?.name;

    if (!staffId || !staffName) {
      const response: ApiResponse = {
        success: false,
        error: "Staff authentication required",
      };
      res.status(401).json(response);
      return;
    }

    const medicineData: CreateMedicineDTO = req.body;

    const medicine = await MedicineService.createMedicine(
      MedicineModel,
      MedicineStockModel,
      medicineData,
      staffId,
      staffName,
      "staff",
      CategoryModel
    );

    const response: ApiResponse = {
      success: true,
      data: medicine,
      message: "Medicine created successfully",
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating medicine:", error);
    const status =
      error instanceof Error && error.message.includes("already exists")
        ? 400
        : 500;
    const response: ApiResponse = {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create medicine",
    };
    res.status(status).json(response);
  }
};

/**
 * Nhập hàng thuốc
 */
export const importStock = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const staffId = (req as any).staff?.id;
    const staffName = (req as any).staff?.name;

    if (!staffId || !staffName) {
      const response: ApiResponse = {
        success: false,
        error: "Staff authentication required",
      };
      res.status(401).json(response);
      return;
    }

    const importData: MedicineImportDTO = req.body;

    const result = await MedicineService.importStock(
      MedicineModel,
      MedicineBatchModel,
      MedicineStockModel,
      StockTransactionModel,
      importData,
      staffId,
      staffName
    );

    const response: ApiResponse = {
      success: true,
      data: {
        medicine: result.medicine,
        batch: result.batch,
        transaction: result.transaction,
        stock: result.stock,
        formattedQuantity: MedicineService.formatQuantityDisplay(
          result.transaction.quantity,
          result.medicine.packaging
        ),
      },
      message: "Stock imported successfully",
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error importing stock:", error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to import stock",
    };
    res.status(500).json(response);
  }
};

/**
 * Lấy danh sách thuốc
 */
export const getAllMedicines = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const query: MedicineQuery = {
      search: req.query.search as string,
      categoryId: req.query.categoryId as string,
      status: req.query.status as any,
      requiresPrescription: req.query.requiresPrescription === "true",
      manufacturer: req.query.manufacturer as string,
      stockStatus: req.query.stockStatus as any,
      createdBy: req.query.createdBy as string,
      createdByRole: req.query.createdByRole as any,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
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
  } catch (error) {
    console.error("Error getting medicines:", error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get medicines",
    };
    res.status(500).json(response);
  }
};

/**
 * Lấy thuốc của tôi (staff đã tạo)
 */
export const getMyMedicines = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const staffId = (req as any).staff?.id;

    if (!staffId) {
      const response: ApiResponse = {
        success: false,
        error: "Staff authentication required",
      };
      res.status(401).json(response);
      return;
    }

    const query: MedicineQuery = {
      createdBy: staffId,
      search: req.query.search as string,
      categoryId: req.query.categoryId as string,
      status: req.query.status as any,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
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
      message: "My medicines retrieved successfully",
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error getting my medicines:", error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get medicines",
    };
    res.status(500).json(response);
  }
};

/**
 * Lấy chi tiết thuốc theo ID
 */
export const getMedicineById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      const response: ApiResponse = {
        success: false,
        error: "Invalid medicine ID",
      };
      res.status(400).json(response);
      return;
    }

    const medicine = await MedicineModel.findById(id);

    if (!medicine) {
      const response: ApiResponse = {
        success: false,
        error: "Medicine not found",
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: medicine,
      message: "Medicine retrieved successfully",
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error getting medicine by ID:", error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get medicine",
    };
    res.status(500).json(response);
  }
};

/**
 * Cập nhật thuốc (chỉ cho phép khi CHƯA được admin duyệt - status: pending)
 */
export const updateMedicine = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const staffId = (req as any).staff?.id;
    const staffName = (req as any).staff?.name;
    const { id } = req.params;

    if (!staffId || !staffName) {
      const response: ApiResponse = {
        success: false,
        error: "Staff authentication required",
      };
      res.status(401).json(response);
      return;
    }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      const response: ApiResponse = {
        success: false,
        error: "Invalid medicine ID",
      };
      res.status(400).json(response);
      return;
    }

    const medicine = await MedicineModel.findById(id);
    if (!medicine) {
      const response: ApiResponse = {
        success: false,
        error: "Medicine not found",
      };
      res.status(404).json(response);
      return;
    }

    // Cho phép bất kỳ nhân viên đã xác thực chỉnh sửa (giữ nguyên ràng buộc trạng thái)
    // Nếu muốn chỉ cho admin vượt qua ràng buộc chủ sở hữu, có thể thêm kiểm tra role tại đây

    // Chỉ cho phép khi đang pending
    if (medicine.status !== "pending") {
      const response: ApiResponse = {
        success: false,
        error: "Only pending medicines can be edited",
      };
      res.status(400).json(response);
      return;
    }

    // Cập nhật bằng service để đảm bảo validate packaging, mã thuốc, ...
    const updated = await MedicineService.updateMedicine(
      MedicineModel,
      id,
      req.body,
      staffId,
      staffName
    );

    const response: ApiResponse = {
      success: true,
      data: updated,
      message: "Medicine updated successfully",
    };
    res.status(200).json(response);
  } catch (error) {
    console.error("Error updating medicine:", error);
    const response: ApiResponse = {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update medicine",
    };
    res.status(500).json(response);
  }
};

/**
 * Xóa thuốc (chỉ khi pending và đúng người tạo)
 */
export const deleteMedicine = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const staffId = (req as any).staff?.id;
    const { id } = req.params;

    if (!staffId) {
      const response: ApiResponse = {
        success: false,
        error: "Staff authentication required",
      };
      res.status(401).json(response);
      return;
    }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      const response: ApiResponse = {
        success: false,
        error: "Invalid medicine ID",
      };
      res.status(400).json(response);
      return;
    }

    const medicine = await MedicineModel.findById(id);
    if (!medicine) {
      const response: ApiResponse = {
        success: false,
        error: "Medicine not found",
      };
      res.status(404).json(response);
      return;
    }

    // Cho phép nhân viên đã xác thực xóa (giữ nguyên ràng buộc trạng thái)

    // Chỉ cho phép khi đang pending
    if (medicine.status !== "pending") {
      const response: ApiResponse = {
        success: false,
        error: "Only pending medicines can be deleted",
      };
      res.status(400).json(response);
      return;
    }

    // Xóa medicine và các records liên quan
    await MedicineModel.deleteOne({ _id: id });
    await MedicineStockModel.deleteOne({ medicineId: id });
    await MedicineBatchModel.deleteMany({ medicineId: id });
    await StockTransactionModel.deleteMany({ medicineId: id });

    const response: ApiResponse = {
      success: true,
      data: { id },
      message: "Medicine deleted successfully",
    };
    res.status(200).json(response);
  } catch (error) {
    console.error("Error deleting medicine:", error);
    const response: ApiResponse = {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete medicine",
    };
    res.status(500).json(response);
  }
};

/**
 * Lấy tồn kho thuốc
 */
export const getMedicineStock = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { medicineId } = req.params;

    if (!medicineId || !mongoose.Types.ObjectId.isValid(medicineId)) {
      const response: ApiResponse = {
        success: false,
        error: "Invalid medicine ID",
      };
      res.status(400).json(response);
      return;
    }

    const stock = await MedicineService.getMedicineStock(
      MedicineStockModel,
      medicineId
    );

    // Get medicine info for formatting
    const medicine = await MedicineModel.findById(medicineId);
    if (!medicine) {
      const response: ApiResponse = {
        success: false,
        error: "Medicine not found",
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: {
        ...stock.toObject(),
        formattedQuantity: MedicineService.formatQuantityDisplay(
          stock.totalQuantity,
          medicine.packaging
        ),
        formattedAvailable: MedicineService.formatQuantityDisplay(
          stock.availableQuantity,
          medicine.packaging
        ),
      },
      message: "Medicine stock retrieved successfully",
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error getting medicine stock:", error);
    const response: ApiResponse = {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get medicine stock",
    };
    res.status(500).json(response);
  }
};

/**
 * Lấy danh sách lô hàng của thuốc
 */
export const getMedicineBatches = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { medicineId } = req.params;

    if (!medicineId || !mongoose.Types.ObjectId.isValid(medicineId)) {
      const response: ApiResponse = {
        success: false,
        error: "Invalid medicine ID",
      };
      res.status(400).json(response);
      return;
    }

    const batches = await MedicineService.getMedicineBatches(
      MedicineBatchModel,
      medicineId
    );

    // Get medicine info for formatting
    const medicine = await MedicineModel.findById(medicineId);
    if (!medicine) {
      const response: ApiResponse = {
        success: false,
        error: "Medicine not found",
      };
      res.status(404).json(response);
      return;
    }

    const formattedBatches = batches.map((batch: any) => ({
      ...batch.toObject(),
      formattedQuantity: MedicineService.formatQuantityDisplay(
        batch.totalQuantity,
        medicine.packaging
      ),
      formattedAvailable: MedicineService.formatQuantityDisplay(
        batch.availableQuantity,
        medicine.packaging
      ),
    }));

    const response: ApiResponse = {
      success: true,
      data: formattedBatches,
      message: "Medicine batches retrieved successfully",
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error getting medicine batches:", error);
    const response: ApiResponse = {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get medicine batches",
    };
    res.status(500).json(response);
  }
};

/**
 * Lấy lịch sử giao dịch
 */
export const getTransactionHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { medicineId } = req.params;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 50;

    if (!medicineId || !mongoose.Types.ObjectId.isValid(medicineId)) {
      const response: ApiResponse = {
        success: false,
        error: "Invalid medicine ID",
      };
      res.status(400).json(response);
      return;
    }

    const transactions = await MedicineService.getTransactionHistory(
      StockTransactionModel,
      medicineId,
      limit
    );

    const response: ApiResponse = {
      success: true,
      data: transactions,
      message: "Transaction history retrieved successfully",
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error getting transaction history:", error);
    const response: ApiResponse = {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get transaction history",
    };
    res.status(500).json(response);
  }
};

/**
 * Lấy thống kê tồn kho
 */
export const getStockStatistics = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const stats = await MedicineService.getStockStatistics(
      MedicineStockModel,
      MedicineModel
    );

    const response: ApiResponse = {
      success: true,
      data: stats,
      message: "Stock statistics retrieved successfully",
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error getting stock statistics:", error);
    const response: ApiResponse = {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get stock statistics",
    };
    res.status(500).json(response);
  }
};

/**
 * Lấy thuốc sắp hết hạn
 */
export const getExpiringMedicines = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
    const batches = await MedicineService.getExpiringMedicines(
      MedicineBatchModel,
      days
    );

    const response: ApiResponse = {
      success: true,
      data: batches,
      message: "Expiring medicines retrieved successfully",
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error getting expiring medicines:", error);
    const response: ApiResponse = {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get expiring medicines",
    };
    res.status(500).json(response);
  }
};

/**
 * Lấy thuốc sắp hết hàng
 */
export const getLowStockMedicines = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const medicines = await MedicineService.getLowStockMedicines(
      MedicineStockModel
    );

    const response: ApiResponse = {
      success: true,
      data: medicines,
      message: "Low stock medicines retrieved successfully",
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error getting low stock medicines:", error);
    const response: ApiResponse = {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get low stock medicines",
    };
    res.status(500).json(response);
  }
};

/**
 * Utility: Convert units
 */
export const convertUnits = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { medicineId, quantity, fromUnit, toUnit } = req.body;

    if (!medicineId || !mongoose.Types.ObjectId.isValid(medicineId)) {
      const response: ApiResponse = {
        success: false,
        error: "Invalid medicine ID",
      };
      res.status(400).json(response);
      return;
    }

    const medicine = await MedicineModel.findById(medicineId);
    if (!medicine) {
      const response: ApiResponse = {
        success: false,
        error: "Medicine not found",
      };
      res.status(404).json(response);
      return;
    }

    const tablets = UnitConverter.toTablets(
      quantity,
      fromUnit,
      medicine.packaging
    );
    const convertedQuantity = UnitConverter.fromTablets(
      tablets,
      toUnit,
      medicine.packaging
    );

    const response: ApiResponse = {
      success: true,
      data: {
        originalQuantity: quantity,
        originalUnit: fromUnit,
        convertedQuantity,
        convertedUnit: toUnit,
        tabletsEquivalent: tablets,
        formattedDisplay: MedicineService.formatQuantityDisplay(
          tablets,
          medicine.packaging
        ),
      },
      message: "Unit conversion completed",
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error converting units:", error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to convert units",
    };
    res.status(500).json(response);
  }
};
