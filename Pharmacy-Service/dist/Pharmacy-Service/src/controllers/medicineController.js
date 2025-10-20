"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertUnits = exports.getLowStockMedicines = exports.getExpiringMedicines = exports.getStockStatistics = exports.getTransactionHistory = exports.getMedicineBatches = exports.getMedicineStock = exports.getMedicineById = exports.getMyMedicines = exports.updateMedicine = exports.getAllMedicines = exports.importStock = exports.createMedicine = void 0;
const shared_1 = require("@medicare/shared");
const category_1 = require("../models/category");
const mongoose_1 = __importDefault(require("mongoose"));
const Medicine_1 = require("../models/Medicine");
const createMedicine = async (req, res) => {
    var _a, _b;
    try {
        const staffId = (_a = req.staff) === null || _a === void 0 ? void 0 : _a.id;
        const staffName = (_b = req.staff) === null || _b === void 0 ? void 0 : _b.name;
        if (!staffId || !staffName) {
            const response = {
                success: false,
                error: "Staff authentication required",
            };
            res.status(401).json(response);
            return;
        }
        const medicineData = req.body;
        const medicine = await shared_1.MedicineService.createMedicine(Medicine_1.MedicineModel, Medicine_1.MedicineStockModel, medicineData, staffId, staffName, "staff", category_1.CategoryModel);
        const response = {
            success: true,
            data: medicine,
            message: "Medicine created successfully",
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error("Error creating medicine:", error);
        const status = error instanceof Error && error.message.includes("already exists")
            ? 400
            : 500;
        const response = {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create medicine",
        };
        res.status(status).json(response);
    }
};
exports.createMedicine = createMedicine;
const importStock = async (req, res) => {
    var _a, _b;
    try {
        const staffId = (_a = req.staff) === null || _a === void 0 ? void 0 : _a.id;
        const staffName = (_b = req.staff) === null || _b === void 0 ? void 0 : _b.name;
        if (!staffId || !staffName) {
            const response = {
                success: false,
                error: "Staff authentication required",
            };
            res.status(401).json(response);
            return;
        }
        const importData = req.body;
        const result = await shared_1.MedicineService.importStock(Medicine_1.MedicineModel, Medicine_1.MedicineBatchModel, Medicine_1.MedicineStockModel, Medicine_1.StockTransactionModel, importData, staffId, staffName);
        const response = {
            success: true,
            data: {
                medicine: result.medicine,
                batch: result.batch,
                transaction: result.transaction,
                stock: result.stock,
                formattedQuantity: shared_1.MedicineService.formatQuantityDisplay(result.transaction.quantity, result.medicine.packaging),
            },
            message: "Stock imported successfully",
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Error importing stock:", error);
        const response = {
            success: false,
            error: error instanceof Error ? error.message : "Failed to import stock",
        };
        res.status(500).json(response);
    }
};
exports.importStock = importStock;
const getAllMedicines = async (req, res) => {
    try {
        const query = {
            search: req.query.search,
            categoryId: req.query.categoryId,
            status: req.query.status,
            requiresPrescription: req.query.requiresPrescription === "true",
            manufacturer: req.query.manufacturer,
            stockStatus: req.query.stockStatus,
            createdBy: req.query.createdBy,
            createdByRole: req.query.createdByRole,
            page: req.query.page ? parseInt(req.query.page, 10) : 1,
            limit: req.query.limit ? parseInt(req.query.limit, 10) : 20,
            sortBy: req.query.sortBy || "createdAt",
            sortOrder: req.query.sortOrder || "desc",
        };
        const result = await shared_1.MedicineService.getAllMedicines(Medicine_1.MedicineModel, query);
        const response = {
            success: true,
            data: {
                data: result.medicines,
                pagination: result.pagination,
            },
            message: "Medicines retrieved successfully",
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Error getting medicines:", error);
        const response = {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get medicines",
        };
        res.status(500).json(response);
    }
};
exports.getAllMedicines = getAllMedicines;
const updateMedicine = async (req, res) => {
    var _a, _b;
    try {
        const staffId = (_a = req.staff) === null || _a === void 0 ? void 0 : _a.id;
        const { id } = req.params;
        if (!staffId) {
            const response = {
                success: false,
                error: "Staff authentication required",
            };
            res.status(401).json(response);
            return;
        }
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            const response = {
                success: false,
                error: "Medicine not found",
            };
            res.status(404).json(response);
            return;
        }
        const medicine = await Medicine_1.MedicineModel.findById(id);
        if (!medicine) {
            const response = {
                success: false,
                error: "Medicine not found",
            };
            res.status(404).json(response);
            return;
        }
        if (medicine.createdBy !== staffId) {
            const response = {
                success: false,
                error: "You can only edit medicines you created",
            };
            res.status(403).json(response);
            return;
        }
        if (medicine.status !== "pending") {
            const response = {
                success: false,
                error: "Only pending medicines can be edited",
            };
            res.status(400).json(response);
            return;
        }
        const updated = await shared_1.MedicineService.updateMedicine(Medicine_1.MedicineModel, id, req.body, staffId, ((_b = req.staff) === null || _b === void 0 ? void 0 : _b.name) || "staff");
        const response = {
            success: true,
            data: updated,
            message: "Medicine updated successfully",
        };
        res.status(200).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update medicine",
        };
        res.status(500).json(response);
    }
};
exports.updateMedicine = updateMedicine;
const getMyMedicines = async (req, res) => {
    var _a;
    try {
        const staffId = (_a = req.staff) === null || _a === void 0 ? void 0 : _a.id;
        if (!staffId) {
            const response = {
                success: false,
                error: "Staff authentication required",
            };
            res.status(401).json(response);
            return;
        }
        const query = {
            createdBy: staffId,
            search: req.query.search,
            categoryId: req.query.categoryId,
            status: req.query.status,
            page: req.query.page ? parseInt(req.query.page, 10) : 1,
            limit: req.query.limit ? parseInt(req.query.limit, 10) : 20,
            sortBy: req.query.sortBy || "createdAt",
            sortOrder: req.query.sortOrder || "desc",
        };
        const result = await shared_1.MedicineService.getAllMedicines(Medicine_1.MedicineModel, query);
        const response = {
            success: true,
            data: {
                data: result.medicines,
                pagination: result.pagination,
            },
            message: "My medicines retrieved successfully",
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Error getting my medicines:", error);
        const response = {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get medicines",
        };
        res.status(500).json(response);
    }
};
exports.getMyMedicines = getMyMedicines;
const getMedicineById = async (req, res) => {
    try {
        const { id } = req.params;
        const medicine = await Medicine_1.MedicineModel.findById(id);
        if (!medicine) {
            const response = {
                success: false,
                error: "Medicine not found",
            };
            res.status(404).json(response);
            return;
        }
        const response = {
            success: true,
            data: medicine,
            message: "Medicine retrieved successfully",
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Error getting medicine by ID:", error);
        const response = {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get medicine",
        };
        res.status(500).json(response);
    }
};
exports.getMedicineById = getMedicineById;
const getMedicineStock = async (req, res) => {
    try {
        const { medicineId } = req.params;
        const stock = await shared_1.MedicineService.getMedicineStock(Medicine_1.MedicineStockModel, medicineId);
        const medicine = await Medicine_1.MedicineModel.findById(medicineId);
        if (!medicine) {
            const response = {
                success: false,
                error: "Medicine not found",
            };
            res.status(404).json(response);
            return;
        }
        const response = {
            success: true,
            data: {
                ...stock.toObject(),
                formattedQuantity: shared_1.MedicineService.formatQuantityDisplay(stock.totalQuantity, medicine.packaging),
                formattedAvailable: shared_1.MedicineService.formatQuantityDisplay(stock.availableQuantity, medicine.packaging),
            },
            message: "Medicine stock retrieved successfully",
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Error getting medicine stock:", error);
        const response = {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get medicine stock",
        };
        res.status(500).json(response);
    }
};
exports.getMedicineStock = getMedicineStock;
const getMedicineBatches = async (req, res) => {
    try {
        const { medicineId } = req.params;
        const batches = await shared_1.MedicineService.getMedicineBatches(Medicine_1.MedicineBatchModel, medicineId);
        const medicine = await Medicine_1.MedicineModel.findById(medicineId);
        if (!medicine) {
            const response = {
                success: false,
                error: "Medicine not found",
            };
            res.status(404).json(response);
            return;
        }
        const formattedBatches = batches.map((batch) => ({
            ...batch.toObject(),
            formattedQuantity: shared_1.MedicineService.formatQuantityDisplay(batch.totalQuantity, medicine.packaging),
            formattedAvailable: shared_1.MedicineService.formatQuantityDisplay(batch.availableQuantity, medicine.packaging),
        }));
        const response = {
            success: true,
            data: formattedBatches,
            message: "Medicine batches retrieved successfully",
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Error getting medicine batches:", error);
        const response = {
            success: false,
            error: error instanceof Error
                ? error.message
                : "Failed to get medicine batches",
        };
        res.status(500).json(response);
    }
};
exports.getMedicineBatches = getMedicineBatches;
const getTransactionHistory = async (req, res) => {
    try {
        const { medicineId } = req.params;
        const limit = req.query.limit
            ? parseInt(req.query.limit, 10)
            : 50;
        const transactions = await shared_1.MedicineService.getTransactionHistory(Medicine_1.StockTransactionModel, medicineId, limit);
        const response = {
            success: true,
            data: transactions,
            message: "Transaction history retrieved successfully",
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Error getting transaction history:", error);
        const response = {
            success: false,
            error: error instanceof Error
                ? error.message
                : "Failed to get transaction history",
        };
        res.status(500).json(response);
    }
};
exports.getTransactionHistory = getTransactionHistory;
const getStockStatistics = async (_req, res) => {
    try {
        const stats = await shared_1.MedicineService.getStockStatistics(Medicine_1.MedicineStockModel, Medicine_1.MedicineModel);
        const response = {
            success: true,
            data: stats,
            message: "Stock statistics retrieved successfully",
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Error getting stock statistics:", error);
        const response = {
            success: false,
            error: error instanceof Error
                ? error.message
                : "Failed to get stock statistics",
        };
        res.status(500).json(response);
    }
};
exports.getStockStatistics = getStockStatistics;
const getExpiringMedicines = async (req, res) => {
    try {
        const days = req.query.days ? parseInt(req.query.days, 10) : 30;
        const batches = await shared_1.MedicineService.getExpiringMedicines(Medicine_1.MedicineBatchModel, days);
        const response = {
            success: true,
            data: batches,
            message: "Expiring medicines retrieved successfully",
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Error getting expiring medicines:", error);
        const response = {
            success: false,
            error: error instanceof Error
                ? error.message
                : "Failed to get expiring medicines",
        };
        res.status(500).json(response);
    }
};
exports.getExpiringMedicines = getExpiringMedicines;
const getLowStockMedicines = async (_req, res) => {
    try {
        const medicines = await shared_1.MedicineService.getLowStockMedicines(Medicine_1.MedicineStockModel);
        const response = {
            success: true,
            data: medicines,
            message: "Low stock medicines retrieved successfully",
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Error getting low stock medicines:", error);
        const response = {
            success: false,
            error: error instanceof Error
                ? error.message
                : "Failed to get low stock medicines",
        };
        res.status(500).json(response);
    }
};
exports.getLowStockMedicines = getLowStockMedicines;
const convertUnits = async (req, res) => {
    try {
        const { medicineId, quantity, fromUnit, toUnit } = req.body;
        const medicine = await Medicine_1.MedicineModel.findById(medicineId);
        if (!medicine) {
            const response = {
                success: false,
                error: "Medicine not found",
            };
            res.status(404).json(response);
            return;
        }
        const tablets = shared_1.UnitConverter.toTablets(quantity, fromUnit, medicine.packaging);
        const convertedQuantity = shared_1.UnitConverter.fromTablets(tablets, toUnit, medicine.packaging);
        const response = {
            success: true,
            data: {
                originalQuantity: quantity,
                originalUnit: fromUnit,
                convertedQuantity,
                convertedUnit: toUnit,
                tabletsEquivalent: tablets,
                formattedDisplay: shared_1.MedicineService.formatQuantityDisplay(tablets, medicine.packaging),
            },
            message: "Unit conversion completed",
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Error converting units:", error);
        const response = {
            success: false,
            error: error instanceof Error ? error.message : "Failed to convert units",
        };
        res.status(500).json(response);
    }
};
exports.convertUnits = convertUnits;
//# sourceMappingURL=medicineController.js.map