"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
class CategoryService {
    static async getAllCategories(categoryModel, query) {
        try {
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
            const sort = {};
            sort[query.sortBy || "createdAt"] = query.sortOrder === "asc" ? 1 : -1;
            const page = query.page || 1;
            const limit = query.limit || 10;
            const skip = (page - 1) * limit;
            const [categories, total] = await Promise.all([
                categoryModel
                    .find(filter)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .maxTimeMS(10000),
                categoryModel.countDocuments(filter).maxTimeMS(10000),
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
    }
    static async getCategoryById(categoryModel, id) {
        try {
            const category = await categoryModel.findById(id);
            if (!category) {
                throw new Error("Category not found");
            }
            return category;
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to get category");
        }
    }
    static async createCategory(categoryModel, data, creatorId, creatorName, creatorRole) {
        try {
            const { name, description, code } = data;
            if (!name || !code) {
                throw new Error("Name and code are required");
            }
            const existingCategory = await categoryModel.findOne({
                code: code.toUpperCase(),
            });
            if (existingCategory) {
                throw new Error("Category code already exists");
            }
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
            await category.save();
            return category;
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to create category");
        }
    }
    static async updateCategory(categoryModel, id, data) {
        try {
            const category = await categoryModel.findByIdAndUpdate(id, data, {
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
    }
    static async approveCategory(categoryModel, id, adminId) {
        try {
            const category = await categoryModel.findByIdAndUpdate(id, {
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
    }
    static async rejectCategory(categoryModel, id, reason, adminId) {
        try {
            if (!reason) {
                throw new Error("Rejection reason is required");
            }
            const category = await categoryModel.findByIdAndUpdate(id, {
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
    }
    static async deleteCategory(categoryModel, id) {
        try {
            const result = await categoryModel.findByIdAndDelete(id);
            if (!result) {
                throw new Error("Category not found");
            }
            return true;
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to delete category");
        }
    }
    static async getCategoryStats(categoryModel) {
        try {
            const [totalStats, statusStats, roleStats] = await Promise.all([
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
    }
    static async getApprovedCategories(categoryModel) {
        try {
            const categories = await categoryModel
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
    }
    static async checkCodeExists(categoryModel, code, excludeId) {
        try {
            const filter = { code: code.toUpperCase() };
            if (excludeId) {
                filter._id = { $ne: excludeId };
            }
            const existingCategory = await categoryModel.findOne(filter);
            return !!existingCategory;
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to check category code");
        }
    }
    static async getCountByCreator(categoryModel, creatorId) {
        try {
            const count = await categoryModel.countDocuments({
                createdBy: creatorId,
            });
            return count;
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : "Failed to get category count");
        }
    }
}
exports.CategoryService = CategoryService;
//# sourceMappingURL=CategoryService.js.map