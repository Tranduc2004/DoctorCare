import { Request, Response } from "express";
import {
  ApiResponse,
  CategoryService,
  CreateCategoryDTO,
  CategoryQuery,
  MedicineQuery,
  MedicineService,
} from "@medicare/shared";
import { CategoryModel } from "../models/category";
import { MedicineModel } from "../models/Medicine";

/**
 * Category Controller for Pharmacy Staff
 * Handles: Create categories, View own categories
 */

// Create new category (Staff only)
export const createCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, description, code } = req.body;
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

    const data: CreateCategoryDTO = { name, description, code };

    const category = await CategoryService.createCategory(
      CategoryModel,
      data,
      staffId,
      staffName,
      "staff"
    );

    const response: ApiResponse = {
      success: true,
      data: category,
      message: "Category created and submitted for approval",
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating category:", error);
    const status =
      error instanceof Error && error.message === "Category code already exists"
        ? 400
        : 500;
    const response: ApiResponse = {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create category",
    };
    res.status(status).json(response);
  }
};

// Get my categories (created by current staff) - bao gồm số lượng thuốc
export const getMyCategorycontroller = async (
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

    const query: CategoryQuery & { createdBy?: string } = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
      sortBy: (req.query.sortBy as string) || "createdAt",
      sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
      search: req.query.search as string,
      createdBy: staffId, // Use CategoryService filter
    };

    // Use CategoryService instead of manual query
    const result = await CategoryService.getAllCategories(CategoryModel, query);

    // Enrich my categories with medicine count
    const myCategoriesWithMedicineCount = await Promise.all(
      result.categories.map(async (category: any) => {
        const medicineCount = await MedicineModel.countDocuments({
          categoryId: category._id.toString(),
          status: "active",
        });

        // Also count medicines created by this staff using this category
        const myMedicinesInCategory = await MedicineModel.countDocuments({
          categoryId: category._id.toString(),
          createdBy: staffId,
          status: "active",
        });

        return {
          ...(category.toObject ? category.toObject() : category),
          medicineCount,
          myMedicinesInCategory,
        };
      })
    );

    const response: ApiResponse = {
      success: true,
      data: {
        categories: myCategoriesWithMedicineCount,
        pagination: result.pagination,
      },
      message: "My categories with medicine counts retrieved successfully",
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error getting my categories:", error);
    const response: ApiResponse = {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get categories",
    };
    res.status(500).json(response);
  }
};

// Get approved categories (for dropdown usage)
export const getApprovedCategories = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const categories = await CategoryService.getApprovedCategories(
      CategoryModel
    );

    const response: ApiResponse = {
      success: true,
      data: categories,
      message: "Approved categories retrieved successfully",
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error getting approved categories:", error);
    const response: ApiResponse = {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get categories",
    };
    res.status(500).json(response);
  }
};

// Get category by ID
export const getCategoryById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const category = await CategoryService.getCategoryById(CategoryModel, id);

    const response: ApiResponse = {
      success: true,
      data: category,
      message: "Category retrieved successfully",
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error getting category by ID:", error);
    const status =
      error instanceof Error && error.message === "Category not found"
        ? 404
        : 500;
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get category",
    };
    res.status(status).json(response);
  }
};

// Get all categories with pagination and filters (bao gồm số lượng thuốc)
export const getAllCategories = async (
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

    const query: CategoryQuery = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
      sortBy: (req.query.sortBy as string) || "createdAt",
      sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
      search: req.query.search as string,
      status: req.query.status as
        | "pending"
        | "approved"
        | "rejected"
        | undefined,
    };

    // Use CategoryService instead of duplicate logic
    const result = await CategoryService.getAllCategories(CategoryModel, query);

    // Enrich categories with medicine count
    const categoriesWithMedicineCount = await Promise.all(
      result.categories.map(async (category: any) => {
        const medicineCount = await MedicineModel.countDocuments({
          categoryId: category._id.toString(),
          status: "active",
        });

        return {
          ...(category.toObject ? category.toObject() : category),
          medicineCount,
        };
      })
    );

    const response: ApiResponse = {
      success: true,
      data: {
        categories: categoriesWithMedicineCount,
        pagination: result.pagination,
      },
      message: "Categories with medicine counts retrieved successfully",
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error getting categories:", error);
    const response: ApiResponse = {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get categories",
    };
    res.status(500).json(response);
  }
};

// Get category statistics (bao gồm thống kê liên kết với thuốc)
export const getCategoryStats = async (
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

    // Use CategoryService instead of duplicate logic
    const baseStats = await CategoryService.getCategoryStats(CategoryModel);

    // Add staff-specific stat for "my categories" using CategoryService
    const myCategories = await CategoryService.getCountByCreator(
      CategoryModel,
      staffId
    );

    // Get medicine-related statistics
    const totalMedicines = await MedicineModel.countDocuments({
      status: "active",
    });
    const myMedicines = await MedicineModel.countDocuments({
      createdBy: staffId,
      status: "active",
    });

    // Get categories with most medicines
    const categoriesWithMedicineCount = await MedicineModel.aggregate([
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

    // Get categories with no medicines
    const categoriesWithoutMedicines = await CategoryModel.aggregate([
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

    const emptyCategories = categoriesWithoutMedicines[0]?.count || 0;

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

    const response: ApiResponse = {
      success: true,
      data: stats,
      message:
        "Enhanced category statistics with medicine links retrieved successfully",
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error getting category stats:", error);
    const response: ApiResponse = {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get statistics",
    };
    res.status(500).json(response);
  }
};

// Update category
export const updateCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, code } = req.body;
    const staffId = (req as any).staff?.id;
    const staffName = (req as any).staff?.name;

    if (!staffId) {
      const response: ApiResponse = {
        success: false,
        error: "Staff authentication required",
      };
      res.status(401).json(response);
      return;
    }

    // Find the category first to check ownership
    const category = await CategoryService.getCategoryById(CategoryModel, id);

    // Check if staff owns this category
    if (category.createdBy !== staffId) {
      const response: ApiResponse = {
        success: false,
        error: "You can only edit your own categories",
      };
      res.status(403).json(response);
      return;
    }

    // Check if code is being changed and if it conflicts using CategoryService
    if (code && code !== category.code) {
      const codeExists = await CategoryService.checkCodeExists(
        CategoryModel,
        code,
        id
      );
      if (codeExists) {
        const response: ApiResponse = {
          success: false,
          error: "Category code already exists",
        };
        res.status(400).json(response);
        return;
      }
    }

    // Update category with CategoryService
    const updatedData = {
      name,
      description,
      code,
      status: "pending", // Reset to pending when edited
      updatedBy: staffId,
      updatedByName: staffName,
    };

    const updatedCategory = await CategoryService.updateCategory(
      CategoryModel,
      id,
      updatedData
    );

    const response: ApiResponse = {
      success: true,
      data: updatedCategory,
      message: "Category updated successfully and resubmitted for approval",
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error updating category:", error);
    const status =
      error instanceof Error && error.message === "Category not found"
        ? 404
        : 500;
    const response: ApiResponse = {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update category",
    };
    res.status(status).json(response);
  }
};

// Delete category
export const deleteCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const staffId = (req as any).staff?.id;

    if (!staffId) {
      const response: ApiResponse = {
        success: false,
        error: "Staff authentication required",
      };
      res.status(401).json(response);
      return;
    }

    // Find the category first to check ownership
    const category = await CategoryService.getCategoryById(CategoryModel, id);

    // Check if staff owns this category
    if (category.createdBy !== staffId) {
      const response: ApiResponse = {
        success: false,
        error: "You can only delete your own categories",
      };
      res.status(403).json(response);
      return;
    }

    // Check if category has medicines
    const medicineCount = await MedicineModel.countDocuments({
      categoryId: id,
    });
    if (medicineCount > 0) {
      const response: ApiResponse = {
        success: false,
        error: `Không thể xóa danh mục này vì đang có ${medicineCount} thuốc thuộc danh mục này`,
      };
      res.status(400).json(response);
      return;
    }

    // Delete the category using CategoryService
    await CategoryService.deleteCategory(CategoryModel, id);

    const response: ApiResponse = {
      success: true,
      message: "Category deleted successfully",
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error deleting category:", error);
    const status =
      error instanceof Error && error.message === "Category not found"
        ? 404
        : 500;
    const response: ApiResponse = {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete category",
    };
    res.status(status).json(response);
  }
};

/**
 * Lấy danh sách thuốc theo danh mục
 */
export const getMedicinesByCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const staffId = (req as any).staff?.id;

    if (!staffId) {
      const response: ApiResponse = {
        success: false,
        error: "Staff authentication required",
      };
      res.status(401).json(response);
      return;
    }

    // Verify category exists
    const category = await CategoryService.getCategoryById(
      CategoryModel,
      categoryId
    );

    const query: MedicineQuery = {
      categoryId,
      search: req.query.search as string,
      status: req.query.status as any,
      requiresPrescription: req.query.requiresPrescription === "true",
      manufacturer: req.query.manufacturer as string,
      stockStatus: req.query.stockStatus as any,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      sortBy: (req.query.sortBy as string) || "createdAt",
      sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
    };

    const result = await MedicineService.getAllMedicines(MedicineModel, query);

    const response: ApiResponse = {
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
  } catch (error) {
    console.error("Error getting medicines by category:", error);
    const status =
      error instanceof Error && error.message === "Category not found"
        ? 404
        : 500;
    const response: ApiResponse = {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get medicines by category",
    };
    res.status(status).json(response);
  }
};

/**
 * Lấy thống kê danh mục bao gồm số lượng thuốc
 */
export const getCategoryWithMedicineCount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const staffId = (req as any).staff?.id;

    if (!staffId) {
      const response: ApiResponse = {
        success: false,
        error: "Staff authentication required",
      };
      res.status(401).json(response);
      return;
    }

    const category = await CategoryService.getCategoryById(CategoryModel, id);

    // Count medicines in this category
    const medicineCount = await MedicineModel.countDocuments({
      categoryId: id,
      status: "active",
    });

    // Count total medicines created by this category creator (if staff wants to see their impact)
    const totalMedicinesFromMyCategories = await MedicineModel.countDocuments({
      categoryId: {
        $in: await CategoryModel.find({
          createdBy: category.createdBy,
        }).distinct("_id"),
      },
      status: "active",
    });

    const response: ApiResponse = {
      success: true,
      data: {
        ...(category.toObject ? category.toObject() : category),
        medicineCount,
        totalMedicinesFromMyCategories:
          category.createdBy === staffId
            ? totalMedicinesFromMyCategories
            : undefined,
      },
      message: "Category with medicine count retrieved successfully",
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error getting category with medicine count:", error);
    const status =
      error instanceof Error && error.message === "Category not found"
        ? 404
        : 500;
    const response: ApiResponse = {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get category details",
    };
    res.status(status).json(response);
  }
};
