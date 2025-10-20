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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
/**
 * Centralized Category Service
 * Handles medicine category operations for both Admin and Staff
 */
class CategoryService {
    /**
     * Get all categories with pagination and filtering
     */
    static getAllCategories(categoryModel, query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Build filter object
                const filter = {};
                if (query.status)
                    filter.status = query.status;
                if (query.createdByRole)
                    filter.createdByRole = query.createdByRole;
                if (query.createdBy)
                    filter.createdBy = query.createdBy;
                if (query.isActive !== undefined)
                    filter.isActive = query.isActive;
                if (query.search) {
                    filter.$or = [
                        { name: { $regex: query.search, $options: "i" } },
                        { code: { $regex: query.search, $options: "i" } },
                        { description: { $regex: query.search, $options: "i" } },
                        { createdByName: { $regex: query.search, $options: "i" } },
                    ];
                }
                // Build sort object
                const sort = {};
                sort[query.sortBy || "createdAt"] = query.sortOrder === "asc" ? 1 : -1;
                // Calculate pagination
                const page = query.page || 1;
                const limit = query.limit || 10;
                const skip = (page - 1) * limit;
                // Execute queries with timeout and error handling
                const [categories, total] = yield Promise.all([
                    categoryModel
                        .find(filter)
                        .sort(sort)
                        .skip(skip)
                        .limit(limit)
                        .maxTimeMS(10000), // 10 second timeout
                    categoryModel.countDocuments(filter).maxTimeMS(10000), // 10 second timeout
                ]);
                return {
                    categories,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(total / limit),
                        totalItems: total,
                        itemsPerPage: limit,
                    },
                };
            }
            catch (error) {
                throw new Error(error instanceof Error ? error.message : "Failed to get categories");
            }
        });
    }
    /**
     * Get category by ID
     */
    static getCategoryById(categoryModel, id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const category = yield categoryModel.findById(id);
                if (!category) {
                    throw new Error("Category not found");
                }
                return category;
            }
            catch (error) {
                throw new Error(error instanceof Error ? error.message : "Failed to get category");
            }
        });
    }
    /**
     * Create new category
     */
    static createCategory(categoryModel, data, creatorId, creatorName, creatorRole) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name, description, code } = data;
                if (!name || !code) {
                    throw new Error("Name and code are required");
                }
                // Check if code already exists
                const existingCategory = yield categoryModel.findOne({
                    code: code.toUpperCase(),
                });
                if (existingCategory) {
                    throw new Error("Category code already exists");
                }
                // Auto-approve if created by admin, pending if by staff
                const status = creatorRole === "admin" ? "approved" : "pending";
                const approvedBy = creatorRole === "admin" ? creatorId : undefined;
                const approvedAt = creatorRole === "admin" ? new Date() : undefined;
                const category = new categoryModel({
                    name,
                    description,
                    code: code.toUpperCase(),
                    createdBy: creatorId,
                    createdByName: creatorName,
                    createdByRole: creatorRole,
                    status,
                    approvedBy,
                    approvedAt,
                });
                yield category.save();
                return category;
            }
            catch (error) {
                throw new Error(error instanceof Error ? error.message : "Failed to create category");
            }
        });
    }
    /**
     * Update category
     */
    static updateCategory(categoryModel, id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const category = yield categoryModel.findByIdAndUpdate(id, data, {
                    new: true,
                    runValidators: true,
                });
                if (!category) {
                    throw new Error("Category not found");
                }
                return category;
            }
            catch (error) {
                throw new Error(error instanceof Error ? error.message : "Failed to update category");
            }
        });
    }
    /**
     * Approve category (Admin only)
     */
    static approveCategory(categoryModel, id, adminId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const category = yield categoryModel.findByIdAndUpdate(id, {
                    status: "approved",
                    approvedBy: adminId,
                    approvedAt: new Date(),
                }, { new: true, runValidators: true });
                if (!category) {
                    throw new Error("Category not found");
                }
                return category;
            }
            catch (error) {
                throw new Error(error instanceof Error ? error.message : "Failed to approve category");
            }
        });
    }
    /**
     * Reject category (Admin only)
     */
    static rejectCategory(categoryModel, id, reason, adminId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!reason) {
                    throw new Error("Rejection reason is required");
                }
                const category = yield categoryModel.findByIdAndUpdate(id, {
                    status: "rejected",
                    rejectedReason: reason,
                    approvedBy: adminId,
                    approvedAt: new Date(),
                }, { new: true, runValidators: true });
                if (!category) {
                    throw new Error("Category not found");
                }
                return category;
            }
            catch (error) {
                throw new Error(error instanceof Error ? error.message : "Failed to reject category");
            }
        });
    }
    /**
     * Delete category
     */
    static deleteCategory(categoryModel, id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield categoryModel.findByIdAndDelete(id);
                if (!result) {
                    throw new Error("Category not found");
                }
                return true;
            }
            catch (error) {
                throw new Error(error instanceof Error ? error.message : "Failed to delete category");
            }
        });
    }
    /**
     * Get category statistics
     */
    static getCategoryStats(categoryModel) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [totalStats, statusStats, roleStats] = yield Promise.all([
                    categoryModel.countDocuments().maxTimeMS(10000),
                    categoryModel
                        .aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
                        .option({ maxTimeMS: 10000 }),
                    categoryModel
                        .aggregate([
                        { $group: { _id: "$createdByRole", count: { $sum: 1 } } },
                    ])
                        .option({ maxTimeMS: 10000 }),
                ]);
                const stats = {
                    total: totalStats,
                    byStatus: statusStats.reduce((acc, item) => {
                        acc[item._id] = item.count;
                        return acc;
                    }, {}),
                    byRole: roleStats.reduce((acc, item) => {
                        acc[item._id] = item.count;
                        return acc;
                    }, {}),
                };
                return stats;
            }
            catch (error) {
                throw new Error(error instanceof Error
                    ? error.message
                    : "Failed to get category statistics");
            }
        });
    }
    /**
     * Get approved categories only (for dropdowns)
     */
    static getApprovedCategories(categoryModel) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const categories = yield categoryModel
                    .find({ status: "approved", isActive: true })
                    .select("name code description")
                    .sort({ name: 1 });
                return categories;
            }
            catch (error) {
                throw new Error(error instanceof Error
                    ? error.message
                    : "Failed to get approved categories");
            }
        });
    }
    /**
     * Check if category code already exists (excluding specific ID)
     */
    static checkCodeExists(categoryModel, code, excludeId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const filter = { code: code.toUpperCase() };
                if (excludeId) {
                    filter._id = { $ne: excludeId };
                }
                const existingCategory = yield categoryModel.findOne(filter);
                return !!existingCategory;
            }
            catch (error) {
                throw new Error(error instanceof Error ? error.message : "Failed to check category code");
            }
        });
    }
    /**
     * Get count of categories by creator
     */
    static getCountByCreator(categoryModel, creatorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const count = yield categoryModel.countDocuments({
                    createdBy: creatorId,
                });
                return count;
            }
            catch (error) {
                throw new Error(error instanceof Error ? error.message : "Failed to get category count");
            }
        });
    }
}
exports.CategoryService = CategoryService;
