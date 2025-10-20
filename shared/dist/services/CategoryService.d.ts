import { CreateCategoryDTO, UpdateCategoryDTO, CategoryQuery } from "../domains/category/CategoryModel";
/**
 * Centralized Category Service
 * Handles medicine category operations for both Admin and Staff
 */
export declare class CategoryService {
    /**
     * Get all categories with pagination and filtering
     */
    static getAllCategories(categoryModel: any, query: CategoryQuery): Promise<{
        categories: any;
        pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: any;
            itemsPerPage: number;
        };
    }>;
    /**
     * Get category by ID
     */
    static getCategoryById(categoryModel: any, id: string): Promise<any>;
    /**
     * Create new category
     */
    static createCategory(categoryModel: any, data: CreateCategoryDTO, creatorId: string, creatorName: string, creatorRole: "admin" | "staff"): Promise<any>;
    /**
     * Update category
     */
    static updateCategory(categoryModel: any, id: string, data: UpdateCategoryDTO): Promise<any>;
    /**
     * Approve category (Admin only)
     */
    static approveCategory(categoryModel: any, id: string, adminId: string): Promise<any>;
    /**
     * Reject category (Admin only)
     */
    static rejectCategory(categoryModel: any, id: string, reason: string, adminId: string): Promise<any>;
    /**
     * Delete category
     */
    static deleteCategory(categoryModel: any, id: string): Promise<boolean>;
    /**
     * Get category statistics
     */
    static getCategoryStats(categoryModel: any): Promise<{
        total: any;
        byStatus: any;
        byRole: any;
    }>;
    /**
     * Get approved categories only (for dropdowns)
     */
    static getApprovedCategories(categoryModel: any): Promise<any>;
    /**
     * Check if category code already exists (excluding specific ID)
     */
    static checkCodeExists(categoryModel: any, code: string, excludeId?: string): Promise<boolean>;
    /**
     * Get count of categories by creator
     */
    static getCountByCreator(categoryModel: any, creatorId: string): Promise<any>;
}
//# sourceMappingURL=CategoryService.d.ts.map