import {
  IMedicine,
  IMedicineBatch,
  IStockTransaction,
  IMedicineStock,
  CreateMedicineDTO,
  MedicineImportDTO,
  MedicineQuery,
  UnitConverter,
  PackagingSpec,
  TransactionType,
} from "../domains/medicine/MedicineModel";
import { NotFoundError, DuplicateError } from "../index";

/**
 * Centralized Medicine Service
 * Xử lý logic nghiệp vụ thuốc và tồn kho theo đúng quy trình kho thuốc
 * VIÊN LÀ ĐƠN VỊ GỐC - TẤT CẢ TÍNH TOÁN DỰA TRÊN VIÊN
 */
export class MedicineService {
  /**
   * Kiểm tra thuốc tồn tại theo mã
   */
  static async getMedicineByCode(
    medicineModel: any,
    code: string
  ): Promise<IMedicine | null> {
    try {
      return await medicineModel.findOne({ code: code.toUpperCase() });
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to check medicine existence"
      );
    }
  }

  /**
   * Validate packaging specifications
   */
  static validatePackaging(packaging: PackagingSpec): void {
    if (!UnitConverter.validatePackaging(packaging)) {
      throw new Error(
        "Invalid packaging specifications. All values must be greater than 0."
      );
    }
  }

  /**
   * So sánh quy cách đóng gói - đảm bảo consistency
   */
  static comparePackaging(
    existing: PackagingSpec,
    incoming: PackagingSpec
  ): boolean {
    return (
      existing.tabletsPerStrip === incoming.tabletsPerStrip &&
      existing.stripsPerBox === incoming.stripsPerBox &&
      existing.boxesPerCarton === incoming.boxesPerCarton
    );
  }

  /**
   * Tạo thuốc mới
   */
  static async createMedicine(
    medicineModel: any,
    stockModel: any,
    data: CreateMedicineDTO,
    creatorId: string,
    creatorName: string,
    creatorRole: "admin" | "staff",
    categoryModel?: any
  ): Promise<IMedicine> {
    try {
      // Validate packaging
      this.validatePackaging(data.packaging);

      // Kiểm tra mã thuốc tồn tại
      const existingMedicine = await this.getMedicineByCode(
        medicineModel,
        data.code
      );
      if (existingMedicine) {
        throw new Error(`Medicine with code ${data.code} already exists`);
      }

      // Lấy categoryName từ categoryId nếu có categoryModel
      let categoryName = data.categoryName;
      if (!categoryName && data.categoryId && categoryModel) {
        const category = await categoryModel.findById(data.categoryId);
        if (category) {
          categoryName = category.name;
        }
      }

      if (!categoryName) {
        throw new Error(
          `Category name is required. Please provide categoryName or ensure categoryId ${data.categoryId} exists.`
        );
      }

      // Tạo thuốc mới
      // If created by staff, mark as pending and inactive until admin approves
      const initialStatus = creatorRole === "admin" ? "active" : "pending";
      const initialIsActive = creatorRole === "admin";

      const medicine = new medicineModel({
        ...data,
        categoryName: categoryName || data.categoryName,
        code: data.code.toUpperCase(),
        status: initialStatus,
        isActive: initialIsActive,
        createdBy: creatorId,
        createdByName: creatorName,
        createdByRole: creatorRole,
      });

      await medicine.save();

      // Tạo stock record tương ứng
      const stock = new stockModel({
        medicineId: medicine._id.toString(),
        medicineName: medicine.name,
        medicineCode: medicine.code,
        totalQuantity: 0,
        availableQuantity: 0,
        reservedQuantity: 0,
        minStockLevel: data.minStockLevel || 0,
        maxStockLevel: data.maxStockLevel || 1000,
        reorderLevel: data.reorderLevel || 50,
        averageCostPerTablet: 0,
        totalStockValue: 0,
        stockStatus: "out_of_stock",
        lastUpdatedBy: creatorId,
        lastUpdatedByName: creatorName,
      });

      await stock.save();

      return medicine;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to create medicine"
      );
    }
  }

  /**
   * Nhập hàng - Logic nghiệp vụ chính
   */
  static async importStock(
    medicineModel: any,
    batchModel: any,
    stockModel: any,
    transactionModel: any,
    importData: MedicineImportDTO,
    staffId: string,
    staffName: string
  ): Promise<{
    medicine: IMedicine;
    batch: IMedicineBatch;
    transaction: IStockTransaction;
    stock: IMedicineStock;
  }> {
    try {
      // 1. Lấy thông tin thuốc
      const medicine = await medicineModel.findById(importData.medicineId);
      if (!medicine) {
        throw new Error("Medicine not found");
      }

      // 2. Validate packaging nếu thuốc đã tồn tại với quy cách khác
      // (Trong trường hợp này medicine đã có packaging, nên ta sẽ dùng packaging có sẵn)
      const packaging = medicine.packaging;

      // 3. Quy đổi về số viên
      const tabletsQuantity = UnitConverter.toTablets(
        importData.quantity,
        importData.unit,
        packaging
      );

      // 4. Tính giá vốn mỗi viên
      const totalCost = importData.quantity * importData.costPerUnit;
      const costPerTablet = totalCost / tabletsQuantity;

      // 5. Kiểm tra lô hàng tồn tại
      let batch = await batchModel.findOne({
        medicineId: importData.medicineId,
        batchNumber: importData.batchNumber,
      });

      if (batch) {
        // Update existing batch
        batch.totalQuantity += tabletsQuantity;
        batch.availableQuantity += tabletsQuantity;
        // Recalculate average cost per tablet
        const oldTotalCost =
          (batch.totalQuantity - tabletsQuantity) * batch.costPerTablet;
        const newTotalCost = oldTotalCost + totalCost;
        batch.costPerTablet = newTotalCost / batch.totalQuantity;
        await batch.save();
      } else {
        // Create new batch
        batch = new batchModel({
          medicineId: importData.medicineId,
          medicineName: medicine.name,
          medicineCode: medicine.code,
          batchNumber: importData.batchNumber,
          manufacturingDate: importData.manufacturingDate,
          expiryDate: importData.expiryDate,
          totalQuantity: tabletsQuantity,
          availableQuantity: tabletsQuantity,
          costPerTablet: costPerTablet,
          purchaseDate: new Date(),
          purchasePrice: totalCost,
          purchaseUnit: importData.unit,
          purchaseQuantity: importData.quantity,
          createdBy: staffId,
          createdByName: staffName,
        });
        await batch.save();
      }

      // 6. Update stock summary
      let stock = await stockModel.findOne({
        medicineId: importData.medicineId,
      });
      if (!stock) {
        throw new Error("Stock record not found for medicine");
      }

      const oldStockValue = stock.totalStockValue;

      stock.totalQuantity += tabletsQuantity;
      stock.availableQuantity += tabletsQuantity;

      // Recalculate average cost and total value
      const newTotalCost = oldStockValue + totalCost;
      stock.averageCostPerTablet =
        stock.totalQuantity > 0 ? newTotalCost / stock.totalQuantity : 0;
      stock.totalStockValue = newTotalCost;

      // Update stock status
      if (stock.totalQuantity <= 0) {
        stock.stockStatus = "out_of_stock";
      } else if (stock.totalQuantity <= stock.reorderLevel) {
        stock.stockStatus = "low_stock";
      } else if (stock.totalQuantity >= stock.maxStockLevel) {
        stock.stockStatus = "overstock";
      } else {
        stock.stockStatus = "in_stock";
      }

      stock.lastUpdated = new Date();
      stock.lastUpdatedBy = staffId;
      stock.lastUpdatedByName = staffName;
      await stock.save();

      // 7. Ghi lịch sử giao dịch
      const transaction = new transactionModel({
        medicineId: importData.medicineId,
        medicineName: medicine.name,
        medicineCode: medicine.code,
        batchId: batch._id.toString(),
        batchNumber: batch.batchNumber,
        type: "import" as TransactionType,
        quantity: tabletsQuantity, // Lưu theo viên
        unit: importData.unit, // Đơn vị giao dịch gốc
        originalQuantity: importData.quantity, // Số lượng theo đơn vị gốc
        costPerTablet: costPerTablet,
        totalCost: totalCost,
        referenceType: "purchase_order",
        reason: "Stock import",
        notes:
          importData.notes ||
          `Imported ${importData.quantity} ${importData.unit} (${tabletsQuantity} viên)`,
        balanceAfter: stock.totalQuantity,
        performedBy: staffId,
        performedByName: staffName,
        performedByRole: "staff",
        performedAt: new Date(),
      });

      await transaction.save();

      return {
        medicine,
        batch,
        transaction,
        stock,
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to import stock"
      );
    }
  }

  /**
   * Lấy danh sách thuốc với phân trang và filter
   */
  static async getAllMedicines(medicineModel: any, query: MedicineQuery) {
    try {
      const filter: any = {};

      // Build filter conditions
      if (query.search) {
        filter.$or = [
          { name: { $regex: query.search, $options: "i" } },
          { genericName: { $regex: query.search, $options: "i" } },
          { code: { $regex: query.search, $options: "i" } },
          { activeIngredient: { $regex: query.search, $options: "i" } },
          { manufacturer: { $regex: query.search, $options: "i" } },
        ];
      }

      if (query.categoryId) filter.categoryId = query.categoryId;
      if (query.status) filter.status = query.status;
      if (query.requiresPrescription !== undefined)
        filter.requiresPrescription = query.requiresPrescription;
      if (query.manufacturer)
        filter.manufacturer = { $regex: query.manufacturer, $options: "i" };
      if (query.createdBy) filter.createdBy = query.createdBy;
      if (query.createdByRole) filter.createdByRole = query.createdByRole;

      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      const sortOptions: any = {};
      sortOptions[query.sortBy || "createdAt"] =
        query.sortOrder === "asc" ? 1 : -1;

      const [medicines, total] = await Promise.all([
        medicineModel.find(filter).sort(sortOptions).skip(skip).limit(limit),
        medicineModel.countDocuments(filter),
      ]);

      return {
        medicines,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to get medicines"
      );
    }
  }

  /**
   * Lấy tồn kho của thuốc
   */
  static async getMedicineStock(
    stockModel: any,
    medicineId: string
  ): Promise<IMedicineStock> {
    try {
      const stock = await stockModel.findOne({ medicineId });
      if (!stock) {
        throw new Error("Stock record not found");
      }
      return stock;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to get medicine stock"
      );
    }
  }

  /**
   * Lấy danh sách lô hàng của thuốc
   */
  static async getMedicineBatches(batchModel: any, medicineId: string) {
    try {
      return await batchModel
        .find({ medicineId })
        .sort({ expiryDate: 1, createdAt: -1 });
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to get medicine batches"
      );
    }
  }

  /**
   * Lấy lịch sử giao dịch
   */
  static async getTransactionHistory(
    transactionModel: any,
    medicineId?: string,
    limit: number = 50
  ) {
    try {
      const filter = medicineId ? { medicineId } : {};
      return await transactionModel
        .find(filter)
        .sort({ performedAt: -1 })
        .limit(limit);
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to get transaction history"
      );
    }
  }

  /**
   * Lấy thống kê tồn kho
   */
  static async getStockStatistics(stockModel: any, medicineModel: any) {
    try {
      const [stockStats, medicineStats] = await Promise.all([
        stockModel.aggregate([
          {
            $group: {
              _id: "$stockStatus",
              count: { $sum: 1 },
              totalValue: { $sum: "$totalStockValue" },
            },
          },
        ]),
        medicineModel.aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
      ]);

      const totalMedicines = await medicineModel.countDocuments();
      const totalStockValue = await stockModel.aggregate([
        { $group: { _id: null, total: { $sum: "$totalStockValue" } } },
      ]);

      return {
        totalMedicines,
        totalStockValue: totalStockValue[0]?.total || 0,
        stockByStatus: stockStats.reduce((acc: any, item: any) => {
          acc[item._id] = { count: item.count, value: item.totalValue };
          return acc;
        }, {}),
        medicinesByStatus: medicineStats.reduce((acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      };
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to get stock statistics"
      );
    }
  }

  /**
   * Kiểm tra thuốc hết hạn sắp đến
   */
  static async getExpiringMedicines(batchModel: any, daysFromNow: number = 30) {
    try {
      const expiryThreshold = new Date();
      expiryThreshold.setDate(expiryThreshold.getDate() + daysFromNow);

      return await batchModel
        .find({
          expiryDate: { $lte: expiryThreshold },
          availableQuantity: { $gt: 0 },
          status: "active",
        })
        .sort({ expiryDate: 1 });
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to get expiring medicines"
      );
    }
  }

  /**
   * Kiểm tra thuốc sắp hết hàng
   */
  static async getLowStockMedicines(stockModel: any) {
    try {
      return await stockModel
        .find({
          $or: [{ stockStatus: "low_stock" }, { stockStatus: "out_of_stock" }],
        })
        .sort({ totalQuantity: 1 });
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to get low stock medicines"
      );
    }
  }

  /**
   * Format hiển thị số lượng theo đơn vị thích hợp
   */
  static formatQuantityDisplay(
    tablets: number,
    packaging: PackagingSpec
  ): string {
    return UnitConverter.formatQuantity(tablets, packaging);
  }

  /**
   * Tính giá trị tồn kho
   */
  static calculateStockValue(quantity: number, costPerTablet: number): number {
    return quantity * costPerTablet;
  }

  /**
   * Cập nhật thuốc
   */
  static async updateMedicine(
    medicineModel: any,
    medicineId: string,
    updateData: Partial<CreateMedicineDTO>,
    updaterId: string,
    updaterName: string
  ): Promise<IMedicine> {
    try {
      const medicine = await medicineModel.findById(medicineId);
      if (!medicine) {
        throw new NotFoundError("Medicine not found");
      }

      // Validate packaging nếu có thay đổi
      if (updateData.packaging) {
        this.validatePackaging(updateData.packaging);
      }

      // Kiểm tra mã thuốc có thay đổi không
      if (updateData.code && updateData.code !== medicine.code) {
        const existingMedicine = await this.getMedicineByCode(
          medicineModel,
          updateData.code
        );
        if (
          existingMedicine &&
          existingMedicine._id.toString() !== medicineId
        ) {
          throw new DuplicateError(
            `Medicine with code ${updateData.code} already exists`
          );
        }
      }

      // Cập nhật thuốc
      Object.assign(medicine, updateData);
      medicine.updatedBy = updaterId;
      medicine.updatedByName = updaterName;
      medicine.updatedAt = new Date();

      await medicine.save();
      return medicine;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof DuplicateError) {
        throw error;
      }
      throw new Error(
        error instanceof Error ? error.message : "Failed to update medicine"
      );
    }
  }

  /**
   * Xóa thuốc (soft delete)
   */
  static async deleteMedicine(
    medicineModel: any,
    medicineId: string,
    deleterId: string,
    deleterName: string
  ): Promise<{ id: string }> {
    try {
      const medicine = await medicineModel.findById(medicineId);
      if (!medicine) {
        throw new NotFoundError("Medicine not found");
      }

      // Soft delete - chỉ đánh dấu là inactive và discontinued
      medicine.status = "discontinued";
      medicine.isActive = false;
      medicine.updatedBy = deleterId;
      medicine.updatedByName = deleterName;
      medicine.updatedAt = new Date();

      await medicine.save();
      return { id: medicine._id.toString() };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(
        error instanceof Error ? error.message : "Failed to delete medicine"
      );
    }
  }
}
