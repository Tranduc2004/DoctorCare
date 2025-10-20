import {
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CategoryQuery,
} from "../domains/category/CategoryModel";

/**
 * Centralized Category Service
 * Handles medicine category operations for both Admin and Staff
 */
export class CategoryService {
  /**
   * Get all categories with pagination and filtering
   */
  static async getAllCategories(categoryModel: any, query: CategoryQuery) {
    try {
      // Build filter object
      const filter: any = {};
      if (query.status) filter.status = query.status;
      if (query.createdByRole) filter.createdByRole = query.createdByRole;
      if (query.createdBy) filter.createdBy = query.createdBy;
      if (query.isActive !== undefined) filter.isActive = query.isActive;
      if (query.search) {
        filter.$or = [
          { name: { $regex: query.search, $options: "i" } },
          { code: { $regex: query.search, $options: "i" } },
          { description: { $regex: query.search, $options: "i" } },
          { createdByName: { $regex: query.search, $options: "i" } },
        ];
      }

      // Build sort object
      const sort: any = {};
      sort[query.sortBy || "createdAt"] = query.sortOrder === "asc" ? 1 : -1;

      // Calculate pagination
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      // Execute queries with timeout and error handling
      const [categories, total] = await Promise.all([
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
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to get categories"
      );
    }
  }

  /**
   * Get category by ID
   */
  static async getCategoryById(categoryModel: any, id: string) {
    try {
      const category = await categoryModel.findById(id);

      if (!category) {
        throw new Error("Category not found");
      }

      return category;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to get category"
      );
    }
  }

  /**
   * Create new category
   */
  static async createCategory(
    categoryModel: any,
    data: CreateCategoryDTO,
    creatorId: string,
    creatorName: string,
    creatorRole: "admin" | "staff"
  ) {
    try {
      const { name, description, code } = data;

      if (!name || !code) {
        throw new Error("Name and code are required");
      }

      // Check if code already exists
      const existingCategory = await categoryModel.findOne({
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

      await category.save();
      return category;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to create category"
      );
    }
  }

  /**
   * Update category
   */
  static async updateCategory(
    categoryModel: any,
    id: string,
    data: UpdateCategoryDTO
  ) {
    try {
      const category = await categoryModel.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      });

      if (!category) {
        throw new Error("Category not found");
      }

      return category;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to update category"
      );
    }
  }

  /**
   * Approve category (Admin only)
   */
  static async approveCategory(
    categoryModel: any,
    id: string,
    adminId: string
  ) {
    try {
      const category = await categoryModel.findByIdAndUpdate(
        id,
        {
          status: "approved",
          approvedBy: adminId,
          approvedAt: new Date(),
        },
        { new: true, runValidators: true }
      );

      if (!category) {
        throw new Error("Category not found");
      }

      return category;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to approve category"
      );
    }
  }

  /**
   * Reject category (Admin only)
   */
  static async rejectCategory(
    categoryModel: any,
    id: string,
    reason: string,
    adminId: string
  ) {
    try {
      if (!reason) {
        throw new Error("Rejection reason is required");
      }

      const category = await categoryModel.findByIdAndUpdate(
        id,
        {
          status: "rejected",
          rejectedReason: reason,
          approvedBy: adminId,
          approvedAt: new Date(),
        },
        { new: true, runValidators: true }
      );

      if (!category) {
        throw new Error("Category not found");
      }

      return category;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to reject category"
      );
    }
  }

  /**
   * Delete category
   */
  static async deleteCategory(categoryModel: any, id: string) {
    try {
      const result = await categoryModel.findByIdAndDelete(id);

      if (!result) {
        throw new Error("Category not found");
      }

      return true;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to delete category"
      );
    }
  }

  /**
   * Get category statistics
   */
  static async getCategoryStats(categoryModel: any) {
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
        byStatus: statusStats.reduce((acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byRole: roleStats.reduce((acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      };

      return stats;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to get category statistics"
      );
    }
  }

  /**
   * Get approved categories only (for dropdowns)
   */
  static async getApprovedCategories(categoryModel: any) {
    try {
      const categories = await categoryModel
        .find({ status: "approved", isActive: true })
        .select("name code description")
        .sort({ name: 1 });

      return categories;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to get approved categories"
      );
    }
  }

  /**
   * Check if category code already exists (excluding specific ID)
   */
  static async checkCodeExists(
    categoryModel: any,
    code: string,
    excludeId?: string
  ) {
    try {
      const filter: any = { code: code.toUpperCase() };
      if (excludeId) {
        filter._id = { $ne: excludeId };
      }

      const existingCategory = await categoryModel.findOne(filter);
      return !!existingCategory;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to check category code"
      );
    }
  }

  /**
   * Get count of categories by creator
   */
  static async getCountByCreator(categoryModel: any, creatorId: string) {
    try {
      const count = await categoryModel.countDocuments({
        createdBy: creatorId,
      });
      return count;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to get category count"
      );
    }
  }
}
