"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategoryWithMedicineCount = exports.getMedicinesByCategory = exports.deleteCategory = exports.updateCategory = exports.getCategoryStats = exports.getAllCategories = exports.getCategoryById = exports.getApprovedCategories = exports.getMyCategorycontroller = exports.createCategory = void 0;
const shared_1 = require("@medicare/shared");
const category_1 = require("../models/category");
const Medicine_1 = require("../models/Medicine");
const createCategory = async (req, res) => {
    var _a, _b;
    try {
        const { name, description, code } = req.body;
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
        const data = { name, description, code };
        const category = await shared_1.CategoryService.createCategory(category_1.CategoryModel, data, staffId, staffName, "staff");
        const response = {
            success: true,
            data: category,
            message: "Category created and submitted for approval",
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error("Error creating category:", error);
        const status = error instanceof Error && error.message === "Category code already exists"
            ? 400
            : 500;
        const response = {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create category",
        };
        res.status(status).json(response);
    }
};
exports.createCategory = createCategory;
const getMyCategorycontroller = async (req, res) => {
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
            page: req.query.page ? parseInt(req.query.page, 10) : 1,
            limit: req.query.limit ? parseInt(req.query.limit, 10) : 10,
            sortBy: req.query.sortBy || "createdAt",
            sortOrder: req.query.sortOrder || "desc",
            search: req.query.search,
            createdBy: staffId,
        };
        const result = await shared_1.CategoryService.getAllCategories(category_1.CategoryModel, query);
        const myCategoriesWithMedicineCount = await Promise.all(result.categories.map(async (category) => {
            const medicineCount = await Medicine_1.MedicineModel.countDocuments({
                categoryId: category._id.toString(),
                status: "active",
            });
            const myMedicinesInCategory = await Medicine_1.MedicineModel.countDocuments({
                categoryId: category._id.toString(),
                createdBy: staffId,
                status: "active",
            });
            return {
                ...(category.toObject ? category.toObject() : category),
                medicineCount,
                myMedicinesInCategory,
            };
        }));
        const response = {
            success: true,
            data: {
                categories: myCategoriesWithMedicineCount,
                pagination: result.pagination,
            },
            message: "My categories with medicine counts retrieved successfully",
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Error getting my categories:", error);
        const response = {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get categories",
        };
        res.status(500).json(response);
    }
};
exports.getMyCategorycontroller = getMyCategorycontroller;
const getApprovedCategories = async (_req, res) => {
    try {
        const categories = await shared_1.CategoryService.getApprovedCategories(category_1.CategoryModel);
        const response = {
            success: true,
            data: categories,
            message: "Approved categories retrieved successfully",
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Error getting approved categories:", error);
        const response = {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get categories",
        };
        res.status(500).json(response);
    }
};
exports.getApprovedCategories = getApprovedCategories;
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await shared_1.CategoryService.getCategoryById(category_1.CategoryModel, id);
        const response = {
            success: true,
            data: category,
            message: "Category retrieved successfully",
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Error getting category by ID:", error);
        const status = error instanceof Error && error.message === "Category not found"
            ? 404
            : 500;
        const response = {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get category",
        };
        res.status(status).json(response);
    }
};
exports.getCategoryById = getCategoryById;
const getAllCategories = async (req, res) => {
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
            page: req.query.page ? parseInt(req.query.page, 10) : 1,
            limit: req.query.limit ? parseInt(req.query.limit, 10) : 10,
            sortBy: req.query.sortBy || "createdAt",
            sortOrder: req.query.sortOrder || "desc",
            search: req.query.search,
            status: req.query.status,
        };
        const result = await shared_1.CategoryService.getAllCategories(category_1.CategoryModel, query);
        const categoriesWithMedicineCount = await Promise.all(result.categories.map(async (category) => {
            const medicineCount = await Medicine_1.MedicineModel.countDocuments({
                categoryId: category._id.toString(),
                status: "active",
            });
            return {
                ...(category.toObject ? category.toObject() : category),
                medicineCount,
            };
        }));
        const response = {
            success: true,
            data: {
                categories: categoriesWithMedicineCount,
                pagination: result.pagination,
            },
            message: "Categories with medicine counts retrieved successfully",
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Error getting categories:", error);
        const response = {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get categories",
        };
        res.status(500).json(response);
    }
};
exports.getAllCategories = getAllCategories;
const getCategoryStats = async (req, res) => {
    var _a, _b;
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
        const baseStats = await shared_1.CategoryService.getCategoryStats(category_1.CategoryModel);
        const myCategories = await shared_1.CategoryService.getCountByCreator(category_1.CategoryModel, staffId);
        const totalMedicines = await Medicine_1.MedicineModel.countDocuments({
            status: "active",
        });
        const myMedicines = await Medicine_1.MedicineModel.countDocuments({
            createdBy: staffId,
            status: "active",
        });
        const categoriesWithMedicineCount = await Medicine_1.MedicineModel.aggregate([
            { $match: { status: "active" } },
            { $group: { _id: "$categoryId", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "medicinecategories",
                    localField: "_id",
                    foreignField: "_id",
                    as: "category",
                },
            },
            { $unwind: "$category" },
            {
                $project: {
                    categoryId: "$_id",
                    categoryName: "$category.name",
                    categoryCode: "$category.code",
                    medicineCount: "$count",
                },
            },
        ]);
        const categoriesWithoutMedicines = await category_1.CategoryModel.aggregate([
            {
                $lookup: {
                    from: "medicines",
                    let: { categoryId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$categoryId", { $toString: "$$categoryId" }] },
                                status: "active",
                            },
                        },
                    ],
                    as: "medicines",
                },
            },
            { $match: { medicines: { $size: 0 } } },
            { $count: "count" },
        ]);
        const emptyCategories = ((_b = categoriesWithoutMedicines[0]) === null || _b === void 0 ? void 0 : _b.count) || 0;
        const stats = {
            ...baseStats,
            myCategories,
            medicineStats: {
                totalMedicines,
                myMedicines,
                categoriesWithMedicines: baseStats.total - emptyCategories,
                emptyCategoriesCount: emptyCategories,
                topCategoriesByMedicineCount: categoriesWithMedicineCount,
            },
        };
        const response = {
            success: true,
            data: stats,
            message: "Enhanced category statistics with medicine links retrieved successfully",
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Error getting category stats:", error);
        const response = {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get statistics",
        };
        res.status(500).json(response);
    }
};
exports.getCategoryStats = getCategoryStats;
const updateCategory = async (req, res) => {
    var _a, _b;
    try {
        const { id } = req.params;
        const { name, description, code } = req.body;
        const staffId = (_a = req.staff) === null || _a === void 0 ? void 0 : _a.id;
        const staffName = (_b = req.staff) === null || _b === void 0 ? void 0 : _b.name;
        if (!staffId) {
            const response = {
                success: false,
                error: "Staff authentication required",
            };
            res.status(401).json(response);
            return;
        }
        const category = await shared_1.CategoryService.getCategoryById(category_1.CategoryModel, id);
        if (category.createdBy !== staffId) {
            const response = {
                success: false,
                error: "You can only edit your own categories",
            };
            res.status(403).json(response);
            return;
        }
        if (code && code !== category.code) {
            const codeExists = await shared_1.CategoryService.checkCodeExists(category_1.CategoryModel, code, id);
            if (codeExists) {
                const response = {
                    success: false,
                    error: "Category code already exists",
                };
                res.status(400).json(response);
                return;
            }
        }
        const updatedData = {
            name,
            description,
            code,
            status: "pending",
            updatedBy: staffId,
            updatedByName: staffName,
        };
        const updatedCategory = await shared_1.CategoryService.updateCategory(category_1.CategoryModel, id, updatedData);
        const response = {
            success: true,
            data: updatedCategory,
            message: "Category updated successfully and resubmitted for approval",
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Error updating category:", error);
        const status = error instanceof Error && error.message === "Category not found"
            ? 404
            : 500;
        const response = {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update category",
        };
        res.status(status).json(response);
    }
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res) => {
    var _a;
    try {
        const { id } = req.params;
        const staffId = (_a = req.staff) === null || _a === void 0 ? void 0 : _a.id;
        if (!staffId) {
            const response = {
                success: false,
                error: "Staff authentication required",
            };
            res.status(401).json(response);
            return;
        }
        const category = await shared_1.CategoryService.getCategoryById(category_1.CategoryModel, id);
        if (category.createdBy !== staffId) {
            const response = {
                success: false,
                error: "You can only delete your own categories",
            };
            res.status(403).json(response);
            return;
        }
        const medicineCount = await Medicine_1.MedicineModel.countDocuments({
            categoryId: id,
        });
        if (medicineCount > 0) {
            const response = {
                success: false,
                error: `Không thể xóa danh mục này vì đang có ${medicineCount} thuốc thuộc danh mục này`,
            };
            res.status(400).json(response);
            return;
        }
        await shared_1.CategoryService.deleteCategory(category_1.CategoryModel, id);
        const response = {
            success: true,
            message: "Category deleted successfully",
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Error deleting category:", error);
        const status = error instanceof Error && error.message === "Category not found"
            ? 404
            : 500;
        const response = {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete category",
        };
        res.status(status).json(response);
    }
};
exports.deleteCategory = deleteCategory;
const getMedicinesByCategory = async (req, res) => {
    var _a;
    try {
        const { categoryId } = req.params;
        const staffId = (_a = req.staff) === null || _a === void 0 ? void 0 : _a.id;
        if (!staffId) {
            const response = {
                success: false,
                error: "Staff authentication required",
            };
            res.status(401).json(response);
            return;
        }
        const category = await shared_1.CategoryService.getCategoryById(category_1.CategoryModel, categoryId);
        const query = {
            categoryId,
            search: req.query.search,
            status: req.query.status,
            requiresPrescription: req.query.requiresPrescription === "true",
            manufacturer: req.query.manufacturer,
            stockStatus: req.query.stockStatus,
            page: req.query.page ? parseInt(req.query.page, 10) : 1,
            limit: req.query.limit ? parseInt(req.query.limit, 10) : 20,
            sortBy: req.query.sortBy || "createdAt",
            sortOrder: req.query.sortOrder || "desc",
        };
        const result = await shared_1.MedicineService.getAllMedicines(Medicine_1.MedicineModel, query);
        const response = {
            success: true,
            data: {
                category: {
                    id: category._id,
                    name: category.name,
                    description: category.description,
                    code: category.code,
                },
                medicines: result.medicines,
                pagination: result.pagination,
                totalMedicines: result.pagination.totalItems,
            },
            message: `Medicines in category "${category.name}" retrieved successfully`,
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Error getting medicines by category:", error);
        const status = error instanceof Error && error.message === "Category not found"
            ? 404
            : 500;
        const response = {
            success: false,
            error: error instanceof Error
                ? error.message
                : "Failed to get medicines by category",
        };
        res.status(status).json(response);
    }
};
exports.getMedicinesByCategory = getMedicinesByCategory;
const getCategoryWithMedicineCount = async (req, res) => {
    var _a;
    try {
        const { id } = req.params;
        const staffId = (_a = req.staff) === null || _a === void 0 ? void 0 : _a.id;
        if (!staffId) {
            const response = {
                success: false,
                error: "Staff authentication required",
            };
            res.status(401).json(response);
            return;
        }
        const category = await shared_1.CategoryService.getCategoryById(category_1.CategoryModel, id);
        const medicineCount = await Medicine_1.MedicineModel.countDocuments({
            categoryId: id,
            status: "active",
        });
        const totalMedicinesFromMyCategories = await Medicine_1.MedicineModel.countDocuments({
            categoryId: {
                $in: await category_1.CategoryModel.find({
                    createdBy: category.createdBy,
                }).distinct("_id"),
            },
            status: "active",
        });
        const response = {
            success: true,
            data: {
                ...(category.toObject ? category.toObject() : category),
                medicineCount,
                totalMedicinesFromMyCategories: category.createdBy === staffId
                    ? totalMedicinesFromMyCategories
                    : undefined,
            },
            message: "Category with medicine count retrieved successfully",
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Error getting category with medicine count:", error);
        const status = error instanceof Error && error.message === "Category not found"
            ? 404
            : 500;
        const response = {
            success: false,
            error: error instanceof Error
                ? error.message
                : "Failed to get category details",
        };
        res.status(status).json(response);
    }
};
exports.getCategoryWithMedicineCount = getCategoryWithMedicineCount;
//# sourceMappingURL=categoryController.js.map