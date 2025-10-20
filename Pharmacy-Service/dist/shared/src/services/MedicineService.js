"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicineService = void 0;
const MedicineModel_1 = require("../domains/medicine/MedicineModel");
const index_1 = require("../index");
class MedicineService {
    static async getMedicineByCode(medicineModel, code) {
        try {
            return await medicineModel.findOne({ code: code.toUpperCase() });
        }
        catch (error) {
            throw new Error(error instanceof Error
                ? error.message
                : "Failed to check medicine existence");
        }
    }
    static validatePackaging(packaging) {
        if (!MedicineModel_1.UnitConverter.validatePackaging(packaging)) {
            throw new Error("Invalid packaging specifications. All values must be greater than 0.");
        }
    }
    static comparePackaging(existing, incoming) {
        return (existing.tabletsPerStrip === incoming.tabletsPerStrip &&
            existing.stripsPerBox === incoming.stripsPerBox &&
            existing.boxesPerCarton === incoming.boxesPerCarton);
    }
    static async createMedicine(medicineModel, stockModel, data, creatorId, creatorName, creatorRole, categoryModel) {
        try {
            this.validatePackaging(data.packaging);
            const existingMedicine = await this.getMedicineByCode(medicineModel, data.code);
            if (existingMedicine) {
                throw new Error(`Medicine with code ${data.code} already exists`);
            }
            let categoryName = data.categoryName;
            if (!categoryName && data.categoryId && categoryModel) {
                const category = await categoryModel.findById(data.categoryId);
                if (category) {
                    categoryName = category.name;
                }
            }
            if (!categoryName) {
                throw new Error(`Category name is required. Please provide categoryName or ensure categoryId ${data.categoryId} exists.`);
            }
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
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to create medicine");
        }
    }
    static async importStock(medicineModel, batchModel, stockModel, transactionModel, importData, staffId, staffName) {
        try {
            const medicine = await medicineModel.findById(importData.medicineId);
            if (!medicine) {
                throw new Error("Medicine not found");
            }
            const packaging = medicine.packaging;
            const tabletsQuantity = MedicineModel_1.UnitConverter.toTablets(importData.quantity, importData.unit, packaging);
            const totalCost = importData.quantity * importData.costPerUnit;
            const costPerTablet = totalCost / tabletsQuantity;
            let batch = await batchModel.findOne({
                medicineId: importData.medicineId,
                batchNumber: importData.batchNumber,
            });
            if (batch) {
                batch.totalQuantity += tabletsQuantity;
                batch.availableQuantity += tabletsQuantity;
                const oldTotalCost = (batch.totalQuantity - tabletsQuantity) * batch.costPerTablet;
                const newTotalCost = oldTotalCost + totalCost;
                batch.costPerTablet = newTotalCost / batch.totalQuantity;
                await batch.save();
            }
            else {
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
            let stock = await stockModel.findOne({
                medicineId: importData.medicineId,
            });
            if (!stock) {
                throw new Error("Stock record not found for medicine");
            }
            const oldStockValue = stock.totalStockValue;
            stock.totalQuantity += tabletsQuantity;
            stock.availableQuantity += tabletsQuantity;
            const newTotalCost = oldStockValue + totalCost;
            stock.averageCostPerTablet =
                stock.totalQuantity > 0 ? newTotalCost / stock.totalQuantity : 0;
            stock.totalStockValue = newTotalCost;
            if (stock.totalQuantity <= 0) {
                stock.stockStatus = "out_of_stock";
            }
            else if (stock.totalQuantity <= stock.reorderLevel) {
                stock.stockStatus = "low_stock";
            }
            else if (stock.totalQuantity >= stock.maxStockLevel) {
                stock.stockStatus = "overstock";
            }
            else {
                stock.stockStatus = "in_stock";
            }
            stock.lastUpdated = new Date();
            stock.lastUpdatedBy = staffId;
            stock.lastUpdatedByName = staffName;
            await stock.save();
            const transaction = new transactionModel({
                medicineId: importData.medicineId,
                medicineName: medicine.name,
                medicineCode: medicine.code,
                batchId: batch._id.toString(),
                batchNumber: batch.batchNumber,
                type: "import",
                quantity: tabletsQuantity,
                unit: importData.unit,
                originalQuantity: importData.quantity,
                costPerTablet: costPerTablet,
                totalCost: totalCost,
                referenceType: "purchase_order",
                reason: "Stock import",
                notes: importData.notes ||
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
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to import stock");
        }
    }
    static async getAllMedicines(medicineModel, query) {
        try {
            const filter = {};
            if (query.search) {
                filter.$or = [
                    { name: { $regex: query.search, $options: "i" } },
                    { genericName: { $regex: query.search, $options: "i" } },
                    { code: { $regex: query.search, $options: "i" } },
                    { activeIngredient: { $regex: query.search, $options: "i" } },
                    { manufacturer: { $regex: query.search, $options: "i" } },
                ];
            }
            if (query.categoryId)
                filter.categoryId = query.categoryId;
            if (query.status)
                filter.status = query.status;
            if (query.requiresPrescription !== undefined)
                filter.requiresPrescription = query.requiresPrescription;
            if (query.manufacturer)
                filter.manufacturer = { $regex: query.manufacturer, $options: "i" };
            if (query.createdBy)
                filter.createdBy = query.createdBy;
            if (query.createdByRole)
                filter.createdByRole = query.createdByRole;
            const page = query.page || 1;
            const limit = query.limit || 10;
            const skip = (page - 1) * limit;
            const sortOptions = {};
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
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to get medicines");
        }
    }
    static async getMedicineStock(stockModel, medicineId) {
        try {
            const stock = await stockModel.findOne({ medicineId });
            if (!stock) {
                throw new Error("Stock record not found");
            }
            return stock;
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to get medicine stock");
        }
    }
    static async getMedicineBatches(batchModel, medicineId) {
        try {
            return await batchModel
                .find({ medicineId })
                .sort({ expiryDate: 1, createdAt: -1 });
        }
        catch (error) {
            throw new Error(error instanceof Error
                ? error.message
                : "Failed to get medicine batches");
        }
    }
    static async getTransactionHistory(transactionModel, medicineId, limit = 50) {
        try {
            const filter = medicineId ? { medicineId } : {};
            return await transactionModel
                .find(filter)
                .sort({ performedAt: -1 })
                .limit(limit);
        }
        catch (error) {
            throw new Error(error instanceof Error
                ? error.message
                : "Failed to get transaction history");
        }
    }
    static async getStockStatistics(stockModel, medicineModel) {
        var _a;
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
                totalStockValue: ((_a = totalStockValue[0]) === null || _a === void 0 ? void 0 : _a.total) || 0,
                stockByStatus: stockStats.reduce((acc, item) => {
                    acc[item._id] = { count: item.count, value: item.totalValue };
                    return acc;
                }, {}),
                medicinesByStatus: medicineStats.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
            };
        }
        catch (error) {
            throw new Error(error instanceof Error
                ? error.message
                : "Failed to get stock statistics");
        }
    }
    static async getExpiringMedicines(batchModel, daysFromNow = 30) {
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
        }
        catch (error) {
            throw new Error(error instanceof Error
                ? error.message
                : "Failed to get expiring medicines");
        }
    }
    static async getLowStockMedicines(stockModel) {
        try {
            return await stockModel
                .find({
                $or: [{ stockStatus: "low_stock" }, { stockStatus: "out_of_stock" }],
            })
                .sort({ totalQuantity: 1 });
        }
        catch (error) {
            throw new Error(error instanceof Error
                ? error.message
                : "Failed to get low stock medicines");
        }
    }
    static formatQuantityDisplay(tablets, packaging) {
        return MedicineModel_1.UnitConverter.formatQuantity(tablets, packaging);
    }
    static calculateStockValue(quantity, costPerTablet) {
        return quantity * costPerTablet;
    }
    static async updateMedicine(medicineModel, medicineId, updateData, updaterId, updaterName) {
        try {
            const medicine = await medicineModel.findById(medicineId);
            if (!medicine) {
                throw new index_1.NotFoundError("Medicine not found");
            }
            if (updateData.packaging) {
                this.validatePackaging(updateData.packaging);
            }
            if (updateData.code && updateData.code !== medicine.code) {
                const existingMedicine = await this.getMedicineByCode(medicineModel, updateData.code);
                if (existingMedicine &&
                    existingMedicine._id.toString() !== medicineId) {
                    throw new index_1.DuplicateError(`Medicine with code ${updateData.code} already exists`);
                }
            }
            Object.assign(medicine, updateData);
            medicine.updatedBy = updaterId;
            medicine.updatedByName = updaterName;
            medicine.updatedAt = new Date();
            await medicine.save();
            return medicine;
        }
        catch (error) {
            if (error instanceof index_1.NotFoundError || error instanceof index_1.DuplicateError) {
                throw error;
            }
            throw new Error(error instanceof Error ? error.message : "Failed to update medicine");
        }
    }
    static async deleteMedicine(medicineModel, medicineId, deleterId, deleterName) {
        try {
            const medicine = await medicineModel.findById(medicineId);
            if (!medicine) {
                throw new index_1.NotFoundError("Medicine not found");
            }
            medicine.status = "discontinued";
            medicine.isActive = false;
            medicine.updatedBy = deleterId;
            medicine.updatedByName = deleterName;
            medicine.updatedAt = new Date();
            await medicine.save();
            return { id: medicine._id.toString() };
        }
        catch (error) {
            if (error instanceof index_1.NotFoundError) {
                throw error;
            }
            throw new Error(error instanceof Error ? error.message : "Failed to delete medicine");
        }
    }
}
exports.MedicineService = MedicineService;
//# sourceMappingURL=MedicineService.js.map