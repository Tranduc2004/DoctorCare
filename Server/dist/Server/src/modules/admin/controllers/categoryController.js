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
exports.CategoryController = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const shared_1 = require("@medicare/shared");
const category_1 = require("../../../models/category");
function getRequestId(req) {
    return req.headers["x-request-id"] || undefined;
}
function adminOnly(req) {
    const user = req.user || req.admin;
    return (user && (user.role === "admin" || user.isAdmin === true || user.adminId));
}
class CategoryController {
    static list(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const requestId = getRequestId(req);
            try {
                const page = Math.max(1, parseInt(req.query.page || "1", 10));
                let limit = parseInt(req.query.limit || "10", 10);
                if (Number.isNaN(limit))
                    limit = 10;
                limit = Math.min(Math.max(1, limit), 100);
                const query = {};
                if (req.query.status)
                    query.status = String(req.query.status);
                if (req.query.search)
                    query.search = String(req.query.search);
                if (req.query.createdByRole)
                    query.createdByRole = String(req.query.createdByRole);
                query.page = page;
                query.limit = limit;
                const result = yield shared_1.CategoryService.getAllCategories(category_1.CategoryModel, query);
                const response = {
                    success: true,
                    data: {
                        categories: result.categories,
                        pagination: result.pagination,
                    },
                };
                return res.status(200).json(response);
            }
            catch (error) {
                console.error("[CategoryController.list]", requestId, (error === null || error === void 0 ? void 0 : error.message) || error);
                const response = {
                    success: false,
                    error: "INTERNAL_ERROR",
                    message: (error === null || error === void 0 ? void 0 : error.message) || "Failed to list categories",
                };
                return res.status(500).json(response);
            }
        });
    }
    static getById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const requestId = getRequestId(req);
            try {
                const { id } = req.params;
                if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
                    const response = {
                        success: false,
                        error: "NOT_FOUND",
                        message: "Category not found",
                    };
                    return res.status(404).json(response);
                }
                const category = yield shared_1.CategoryService.getCategoryById(category_1.CategoryModel, id);
                const response = {
                    success: true,
                    data: category,
                };
                return res.status(200).json(response);
            }
            catch (error) {
                console.error("[CategoryController.getById]", requestId, (error === null || error === void 0 ? void 0 : error.message) || error);
                if (error.message === "Category not found") {
                    const response = {
                        success: false,
                        error: "NOT_FOUND",
                        message: "Category not found",
                    };
                    return res.status(404).json(response);
                }
                const response = {
                    success: false,
                    error: "INTERNAL_ERROR",
                    message: (error === null || error === void 0 ? void 0 : error.message) || "Failed to get category",
                };
                return res.status(500).json(response);
            }
        });
    }
    static create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const requestId = getRequestId(req);
            try {
                if (!adminOnly(req)) {
                    const response = {
                        success: false,
                        error: "FORBIDDEN",
                        message: "Access denied",
                    };
                    return res.status(403).json(response);
                }
                const user = req.admin ||
                    req.user || { id: "admin", username: "admin" };
                const created = yield shared_1.CategoryService.createCategory(category_1.CategoryModel, req.body, user.id || user.adminId, user.username || user.adminUsername, "admin");
                const response = {
                    success: true,
                    data: created,
                    message: "Category created successfully",
                };
                return res.status(201).json(response);
            }
            catch (error) {
                console.error("[CategoryController.create]", requestId, (error === null || error === void 0 ? void 0 : error.message) || error);
                if (error.message === "Category code already exists") {
                    const response = {
                        success: false,
                        error: "DUPLICATE_ERROR",
                        message: error.message,
                    };
                    return res.status(400).json(response);
                }
                if (error.message === "Name and code are required") {
                    const response = {
                        success: false,
                        error: "VALIDATION_ERROR",
                        message: error.message,
                    };
                    return res.status(400).json(response);
                }
                const response = {
                    success: false,
                    error: "INTERNAL_ERROR",
                    message: (error === null || error === void 0 ? void 0 : error.message) || "Failed to create category",
                };
                return res.status(500).json(response);
            }
        });
    }
    static update(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const requestId = getRequestId(req);
            try {
                if (!adminOnly(req)) {
                    const response = {
                        success: false,
                        error: "FORBIDDEN",
                        message: "Access denied",
                    };
                    return res.status(403).json(response);
                }
                const { id } = req.params;
                if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
                    const response = {
                        success: false,
                        error: "NOT_FOUND",
                        message: "Category not found",
                    };
                    return res.status(404).json(response);
                }
                const updated = yield shared_1.CategoryService.updateCategory(category_1.CategoryModel, id, req.body);
                const response = {
                    success: true,
                    data: updated,
                    message: "Category updated successfully",
                };
                return res.status(200).json(response);
            }
            catch (error) {
                console.error("[CategoryController.update]", requestId, (error === null || error === void 0 ? void 0 : error.message) || error);
                if (error.message === "Category not found") {
                    const response = {
                        success: false,
                        error: "NOT_FOUND",
                        message: "Category not found",
                    };
                    return res.status(404).json(response);
                }
                const response = {
                    success: false,
                    error: "INTERNAL_ERROR",
                    message: (error === null || error === void 0 ? void 0 : error.message) || "Failed to update category",
                };
                return res.status(500).json(response);
            }
        });
    }
    static approve(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const requestId = getRequestId(req);
            try {
                if (!adminOnly(req)) {
                    const response = {
                        success: false,
                        error: "FORBIDDEN",
                        message: "Access denied",
                    };
                    return res.status(403).json(response);
                }
                const { id } = req.params;
                if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
                    const response = {
                        success: false,
                        error: "NOT_FOUND",
                        message: "Category not found",
                    };
                    return res.status(404).json(response);
                }
                const adminId = ((_a = req.admin) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id) || "admin";
                const approved = yield shared_1.CategoryService.approveCategory(category_1.CategoryModel, id, adminId);
                const response = {
                    success: true,
                    data: approved,
                    message: "Category approved successfully",
                };
                return res.status(200).json(response);
            }
            catch (error) {
                console.error("[CategoryController.approve]", requestId, (error === null || error === void 0 ? void 0 : error.message) || error);
                if (error.message === "Category not found") {
                    const response = {
                        success: false,
                        error: "NOT_FOUND",
                        message: "Category not found",
                    };
                    return res.status(404).json(response);
                }
                const response = {
                    success: false,
                    error: "INTERNAL_ERROR",
                    message: (error === null || error === void 0 ? void 0 : error.message) || "Failed to approve category",
                };
                return res.status(500).json(response);
            }
        });
    }
    static reject(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const requestId = getRequestId(req);
            try {
                if (!adminOnly(req)) {
                    const response = {
                        success: false,
                        error: "FORBIDDEN",
                        message: "Access denied",
                    };
                    return res.status(403).json(response);
                }
                const { id } = req.params;
                const { reason } = req.body || {};
                if (!reason || String(reason).trim() === "") {
                    const response = {
                        success: false,
                        error: "VALIDATION_ERROR",
                        message: "Rejection reason is required",
                    };
                    return res.status(400).json(response);
                }
                if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
                    const response = {
                        success: false,
                        error: "NOT_FOUND",
                        message: "Category not found",
                    };
                    return res.status(404).json(response);
                }
                const adminId = ((_a = req.admin) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id) || "admin";
                const rejected = yield shared_1.CategoryService.rejectCategory(category_1.CategoryModel, id, reason, adminId);
                const response = {
                    success: true,
                    data: rejected,
                    message: "Category rejected successfully",
                };
                return res.status(200).json(response);
            }
            catch (error) {
                console.error("[CategoryController.reject]", requestId, (error === null || error === void 0 ? void 0 : error.message) || error);
                if (error.message === "Category not found") {
                    const response = {
                        success: false,
                        error: "NOT_FOUND",
                        message: "Category not found",
                    };
                    return res.status(404).json(response);
                }
                if (error.message === "Rejection reason is required") {
                    const response = {
                        success: false,
                        error: "VALIDATION_ERROR",
                        message: error.message,
                    };
                    return res.status(400).json(response);
                }
                const response = {
                    success: false,
                    error: "INTERNAL_ERROR",
                    message: (error === null || error === void 0 ? void 0 : error.message) || "Failed to reject category",
                };
                return res.status(500).json(response);
            }
        });
    }
    static remove(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const requestId = getRequestId(req);
            try {
                if (!adminOnly(req)) {
                    const response = {
                        success: false,
                        error: "FORBIDDEN",
                        message: "Access denied",
                    };
                    return res.status(403).json(response);
                }
                const { id } = req.params;
                if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
                    const response = {
                        success: false,
                        error: "NOT_FOUND",
                        message: "Category not found",
                    };
                    return res.status(404).json(response);
                }
                yield shared_1.CategoryService.deleteCategory(category_1.CategoryModel, id);
                const response = {
                    success: true,
                    data: { id },
                    message: "Category deleted successfully",
                };
                return res.status(200).json(response);
            }
            catch (error) {
                console.error("[CategoryController.remove]", requestId, (error === null || error === void 0 ? void 0 : error.message) || error);
                if (error.message === "Category not found") {
                    const response = {
                        success: false,
                        error: "NOT_FOUND",
                        message: "Category not found",
                    };
                    return res.status(404).json(response);
                }
                const response = {
                    success: false,
                    error: "INTERNAL_ERROR",
                    message: (error === null || error === void 0 ? void 0 : error.message) || "Failed to delete category",
                };
                return res.status(500).json(response);
            }
        });
    }
    static stats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const requestId = getRequestId(req);
            try {
                const stats = yield shared_1.CategoryService.getCategoryStats(category_1.CategoryModel);
                const response = {
                    success: true,
                    data: stats,
                };
                return res.status(200).json(response);
            }
            catch (error) {
                console.error("[CategoryController.stats]", requestId, (error === null || error === void 0 ? void 0 : error.message) || error);
                const response = {
                    success: false,
                    error: "INTERNAL_ERROR",
                    message: (error === null || error === void 0 ? void 0 : error.message) || "Failed to get category stats",
                };
                return res.status(500).json(response);
            }
        });
    }
    static listApproved(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const requestId = getRequestId(req);
            try {
                const items = yield shared_1.CategoryService.getApprovedCategories(category_1.CategoryModel);
                const response = {
                    success: true,
                    data: items,
                };
                return res.status(200).json(response);
            }
            catch (error) {
                console.error("[CategoryController.listApproved]", requestId, (error === null || error === void 0 ? void 0 : error.message) || error);
                const response = {
                    success: false,
                    error: "INTERNAL_ERROR",
                    message: (error === null || error === void 0 ? void 0 : error.message) || "Failed to get approved categories",
                };
                return res.status(500).json(response);
            }
        });
    }
    static listMine(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const requestId = getRequestId(req);
            try {
                const user = req.admin || req.user;
                if (!user) {
                    const response = {
                        success: false,
                        error: "UNAUTHORIZED",
                        message: "User not authenticated",
                    };
                    return res.status(401).json(response);
                }
                const query = {
                    createdBy: user.id || user.adminId,
                    page: 1,
                    limit: 1000, // Get all user's categories
                };
                const result = yield shared_1.CategoryService.getAllCategories(category_1.CategoryModel, query);
                const response = {
                    success: true,
                    data: result.categories,
                };
                return res.status(200).json(response);
            }
            catch (error) {
                console.error("[CategoryController.listMine]", requestId, (error === null || error === void 0 ? void 0 : error.message) || error);
                const response = {
                    success: false,
                    error: "INTERNAL_ERROR",
                    message: (error === null || error === void 0 ? void 0 : error.message) || "Failed to get my categories",
                };
                return res.status(500).json(response);
            }
        });
    }
}
exports.CategoryController = CategoryController;
