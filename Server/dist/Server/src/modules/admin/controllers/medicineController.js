"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMedicineStatistics = exports.deleteMedicine = exports.updateMedicine = exports.getMedicineById = exports.createMedicine = exports.getAllMedicines = exports.rejectMedicine = exports.approveMedicine = exports.getPendingMedicines = exports.adminOnly = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const shared_1 = require("@medicare/shared");
const medicine_1 = require("../../../models/medicine");
// Note: MongoDB connection is expected to be established by the server startup
// (configured via environment/.env). Controllers should not call mongoose.connect.
function getRequestId(req) {
    return req.headers["x-request-id"] || undefined;
}
const adminOnly = (req, res, next) => {
    const user = req.user;
    const isAdmin = user && (user.role === "admin" || user.isAdmin === true);
    if (!isAdmin) {
        return res.status(403).json({ success: false, error: "Forbidden" });
    }
    return next();
};
exports.adminOnly = adminOnly;
const getPendingMedicines = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const requestId = getRequestId(req);
    console.log(`[getPendingMedicines] ${requestId} - Starting request`);
    try {
        // Validate pagination
        const page = Math.max(1, parseInt(req.query.page || "1", 10));
        let limit = parseInt(req.query.limit || "20", 10);
        if (Number.isNaN(limit))
            limit = 20;
        limit = Math.min(Math.max(1, limit), 100);
        console.log(`[getPendingMedicines] ${requestId} - Page: ${page}, Limit: ${limit}`);
        // Use MedicineService.getAllMedicines to retrieve pending medicines
        const query = {
            status: "pending",
            page,
            limit,
            sortBy: "createdAt",
            sortOrder: "desc",
        };
        console.log(`[getPendingMedicines] ${requestId} - Query:`, query);
        const result = yield shared_1.MedicineService.getAllMedicines(medicine_1.MedicineModel, query);
        console.log(`[getPendingMedicines] ${requestId} - Found ${result.medicines.length} medicines`);
        const response = {
            success: true,
            data: {
                data: result.medicines,
                pagination: result.pagination,
            },
            message: "Pending medicines retrieved successfully",
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("[getPendingMedicines]", getRequestId(req), (error === null || error === void 0 ? void 0 : error.message) || error);
        return res.status(500).json({
            success: false,
            error: (error === null || error === void 0 ? void 0 : error.message) || "Failed to get pending medicines",
        });
    }
});
exports.getPendingMedicines = getPendingMedicines;
const approveMedicine = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const requestId = getRequestId(req);
    try {
        const { id } = req.params;
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res
                .status(404)
                .json({ success: false, error: "Medicine not found" });
        }
        const adminId = ((_a = req.admin) === null || _a === void 0 ? void 0 : _a.id) || req.adminId || "admin";
        const adminName = ((_b = req.admin) === null || _b === void 0 ? void 0 : _b.username) || req.adminUsername || "admin";
        // MedicineModel is already imported from local models
        const medicine = yield medicine_1.MedicineModel.findById(id);
        if (!medicine) {
            return res
                .status(404)
                .json({ success: false, error: "Medicine not found" });
        }
        medicine.status = "active";
        medicine.isActive = true;
        medicine.updatedBy = adminId;
        medicine.updatedByName = adminName;
        medicine.updatedAt = new Date();
        yield medicine.save();
        // Ensure MedicineStock exists
        // MedicineStockModel is already imported from local models
        const medIdStr = medicine._id.toString();
        let stock = yield medicine_1.MedicineStockModel.findOne({ medicineId: medIdStr });
        if (!stock) {
            stock = new medicine_1.MedicineStockModel({
                medicineId: medIdStr,
                medicineName: medicine.name,
                medicineCode: medicine.code,
                totalQuantity: 0,
                availableQuantity: 0,
                reservedQuantity: 0,
                minStockLevel: medicine.minStockLevel || 0,
                maxStockLevel: medicine.maxStockLevel || 1000,
                reorderLevel: medicine.reorderLevel || 50,
                averageCostPerTablet: 0,
                totalStockValue: 0,
                stockStatus: "out_of_stock",
                lastUpdated: new Date(),
                lastUpdatedBy: adminId,
                lastUpdatedByName: adminName,
            });
            yield stock.save();
        }
        return res.status(200).json({ success: true, data: medicine });
    }
    catch (error) {
        console.error("[approveMedicine]", requestId, (error === null || error === void 0 ? void 0 : error.message) || error);
        return res.status(500).json({
            success: false,
            error: (error === null || error === void 0 ? void 0 : error.message) || "Failed to approve medicine",
        });
    }
});
exports.approveMedicine = approveMedicine;
const rejectMedicine = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const requestId = getRequestId(req);
    try {
        const { id } = req.params;
        const { reason } = req.body || {};
        if (!reason || String(reason).trim() === "") {
            return res
                .status(400)
                .json({ success: false, error: "reason is required" });
        }
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res
                .status(404)
                .json({ success: false, error: "Medicine not found" });
        }
        const adminId = ((_a = req.admin) === null || _a === void 0 ? void 0 : _a.id) || req.adminId || "admin";
        const adminName = ((_b = req.admin) === null || _b === void 0 ? void 0 : _b.username) || req.adminUsername || "admin";
        // MedicineModel is already imported from local models
        const medicine = yield medicine_1.MedicineModel.findById(id);
        if (!medicine) {
            return res
                .status(404)
                .json({ success: false, error: "Medicine not found" });
        }
        medicine.status = "inactive";
        medicine.isActive = false;
        medicine.rejectedReason = reason || "Rejected by admin";
        medicine.updatedBy = adminId;
        medicine.updatedByName = adminName;
        medicine.updatedAt = new Date();
        yield medicine.save();
        return res.status(200).json({ success: true, data: medicine });
    }
    catch (error) {
        console.error("[rejectMedicine]", requestId, (error === null || error === void 0 ? void 0 : error.message) || error);
        return res.status(500).json({
            success: false,
            error: (error === null || error === void 0 ? void 0 : error.message) || "Failed to reject medicine",
        });
    }
});
exports.rejectMedicine = rejectMedicine;
/**
 * Lấy tất cả thuốc (admin quản lý)
 */
const getAllMedicines = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const requestId = getRequestId(req);
    try {
        // Validate pagination
        const page = Math.max(1, parseInt(req.query.page || "1", 10));
        let limit = parseInt(req.query.limit || "20", 10);
        if (Number.isNaN(limit))
            limit = 20;
        limit = Math.min(Math.max(1, limit), 100);
        const query = {
            search: req.query.search,
            categoryId: req.query.categoryId,
            status: req.query.status,
            requiresPrescription: req.query.requiresPrescription === "true",
            manufacturer: req.query.manufacturer,
            stockStatus: req.query.stockStatus,
            createdBy: req.query.createdBy,
            createdByRole: req.query.createdByRole,
            page,
            limit,
            sortBy: req.query.sortBy || "createdAt",
            sortOrder: req.query.sortOrder || "desc",
        };
        const result = yield shared_1.MedicineService.getAllMedicines(medicine_1.MedicineModel, query);
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
        console.error("[getAllMedicines]", requestId, (error === null || error === void 0 ? void 0 : error.message) || error);
        const response = {
            success: false,
            error: (error === null || error === void 0 ? void 0 : error.message) || "Failed to get medicines",
        };
        res.status(500).json(response);
    }
});
exports.getAllMedicines = getAllMedicines;
/**
 * Tạo thuốc mới (admin)
 */
const createMedicine = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const requestId = getRequestId(req);
    try {
        const adminId = ((_a = req.admin) === null || _a === void 0 ? void 0 : _a.id) || req.adminId || "admin";
        const adminName = ((_b = req.admin) === null || _b === void 0 ? void 0 : _b.username) || req.adminUsername || "admin";
        const medicineData = req.body;
        const medicine = yield shared_1.MedicineService.createMedicine(medicine_1.MedicineModel, medicine_1.MedicineStockModel, medicineData, adminId, adminName, "admin");
        const response = {
            success: true,
            data: medicine,
            message: "Medicine created successfully",
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error("[createMedicine]", requestId, (error === null || error === void 0 ? void 0 : error.message) || error);
        let status = 500;
        if (error instanceof shared_1.ValidationError) {
            status = 400;
        }
        else if (error instanceof shared_1.DuplicateError) {
            status = 409;
        }
        const response = {
            success: false,
            error: (error === null || error === void 0 ? void 0 : error.message) || "Failed to create medicine",
        };
        res.status(status).json(response);
    }
});
exports.createMedicine = createMedicine;
/**
 * Lấy chi tiết thuốc theo ID
 */
const getMedicineById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const requestId = getRequestId(req);
    try {
        const { id } = req.params;
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res
                .status(400)
                .json({ success: false, error: "Invalid medicine ID" });
        }
        const medicine = yield medicine_1.MedicineModel.findById(id);
        if (!medicine) {
            return res
                .status(404)
                .json({ success: false, error: "Medicine not found" });
        }
        const response = {
            success: true,
            data: medicine,
            message: "Medicine retrieved successfully",
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("[getMedicineById]", requestId, (error === null || error === void 0 ? void 0 : error.message) || error);
        const response = {
            success: false,
            error: (error === null || error === void 0 ? void 0 : error.message) || "Failed to get medicine",
        };
        res.status(500).json(response);
    }
});
exports.getMedicineById = getMedicineById;
/**
 * Cập nhật thuốc
 */
const updateMedicine = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const requestId = getRequestId(req);
    try {
        const { id } = req.params;
        const updateData = req.body;
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res
                .status(400)
                .json({ success: false, error: "Invalid medicine ID" });
        }
        const adminId = ((_a = req.admin) === null || _a === void 0 ? void 0 : _a.id) || req.adminId || "admin";
        const adminName = ((_b = req.admin) === null || _b === void 0 ? void 0 : _b.username) || req.adminUsername || "admin";
        const medicine = yield shared_1.MedicineService.updateMedicine(medicine_1.MedicineModel, id, updateData, adminId, adminName);
        const response = {
            success: true,
            data: medicine,
            message: "Medicine updated successfully",
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("[updateMedicine]", requestId, (error === null || error === void 0 ? void 0 : error.message) || error);
        let status = 500;
        if (error instanceof shared_1.ValidationError) {
            status = 400;
        }
        else if (error instanceof shared_1.NotFoundError) {
            status = 404;
        }
        else if (error instanceof shared_1.DuplicateError) {
            status = 409;
        }
        const response = {
            success: false,
            error: (error === null || error === void 0 ? void 0 : error.message) || "Failed to update medicine",
        };
        res.status(status).json(response);
    }
});
exports.updateMedicine = updateMedicine;
/**
 * Xóa thuốc (soft delete)
 */
const deleteMedicine = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const requestId = getRequestId(req);
    try {
        const { id } = req.params;
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res
                .status(400)
                .json({ success: false, error: "Invalid medicine ID" });
        }
        const adminId = ((_a = req.admin) === null || _a === void 0 ? void 0 : _a.id) || req.adminId || "admin";
        const adminName = ((_b = req.admin) === null || _b === void 0 ? void 0 : _b.username) || req.adminUsername || "admin";
        const result = yield shared_1.MedicineService.deleteMedicine(medicine_1.MedicineModel, id, adminId, adminName);
        const response = {
            success: true,
            data: result,
            message: "Medicine deleted successfully",
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("[deleteMedicine]", requestId, (error === null || error === void 0 ? void 0 : error.message) || error);
        let status = 500;
        if (error instanceof shared_1.NotFoundError) {
            status = 404;
        }
        const response = {
            success: false,
            error: (error === null || error === void 0 ? void 0 : error.message) || "Failed to delete medicine",
        };
        res.status(status).json(response);
    }
});
exports.deleteMedicine = deleteMedicine;
/**
 * Lấy thống kê thuốc
 */
const getMedicineStatistics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const requestId = getRequestId(req);
    try {
        const stats = yield shared_1.MedicineService.getStockStatistics(medicine_1.MedicineStockModel, medicine_1.MedicineModel);
        const response = {
            success: true,
            data: stats,
            message: "Medicine statistics retrieved successfully",
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("[getMedicineStatistics]", requestId, (error === null || error === void 0 ? void 0 : error.message) || error);
        const response = {
            success: false,
            error: (error === null || error === void 0 ? void 0 : error.message) || "Failed to get medicine statistics",
        };
        res.status(500).json(response);
    }
});
exports.getMedicineStatistics = getMedicineStatistics;
