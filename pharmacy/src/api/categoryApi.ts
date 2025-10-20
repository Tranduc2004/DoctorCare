import api from "./authApi";

export interface MedicineCategory {
  _id: string;
  name: string;
  description?: string;
  code: string;
  isActive: boolean;
  status: "pending" | "approved" | "rejected";
  createdBy: string;
  createdByName: string;
  createdByRole: "admin" | "staff";
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  createdAt: string;
  updatedAt: string;
  medicineCount?: number;
  myMedicinesInCategory?: number;
}

export interface CategoryStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  myCategories: number;
  medicineStats?: {
    totalMedicines: number;
    myMedicines: number;
    categoriesWithMedicines: number;
    emptyCategoriesCount: number;
    topCategoriesByMedicineCount: {
      categoryId: string;
      categoryName: string;
      categoryCode: string;
      medicineCount: number;
    }[];
  };
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  code: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  code?: string;
}

export interface CategoryQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: "pending" | "approved" | "rejected";
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CategoryDetailData extends MedicineCategory {
  medicineCount: number;
  myMedicinesInCategory?: number;
  totalMedicinesFromMyCategories?: number;
}

export interface Medicine {
  _id: string;
  name: string;
  genericName?: string;
  code: string;
  barcode?: string;
  categoryId: string;
  categoryName: string;
  activeIngredient: string;
  concentration: string;
  dosageForm: string;
  manufacturer: string;
  supplier?: string;
  country?: string;
  requiresPrescription: boolean;
  status: "active" | "inactive" | "discontinued";
  isActive: boolean;
  createdBy: string;
  createdByName: string;
  createdByRole: "admin" | "staff";
  createdAt: string;
  updatedAt?: string;
}

export interface MedicinesByCategory {
  category: {
    id: string;
    name: string;
    description?: string;
    code: string;
  };
  medicines: Medicine[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  totalMedicines: number;
}

export const categoryApi = {
  // Get all categories with medicine counts
  getCategories: async (query: CategoryQuery = {}) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/categories?${params.toString()}`);
    return response.data;
  },

  // Get my categories (created by current staff)
  getMyCategories: async (query: CategoryQuery = {}) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/categories/my?${params.toString()}`);
    return response.data;
  },

  // Get approved categories (for dropdown)
  getApprovedCategories: async () => {
    // Pharmacy frontend talks to Pharmacy-Service (port 5001)
    // Correct endpoint: /api/categories/approved
    const response = await api.get("/categories/approved");
    return response.data;
  },

  // Get category statistics
  getCategoryStats: async (): Promise<{
    success: boolean;
    data: CategoryStats;
  }> => {
    const response = await api.get("/categories/stats");
    return response.data;
  },

  // Get category by ID
  getCategoryById: async (id: string) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  // Get category details with medicine count
  getCategoryDetails: async (
    id: string
  ): Promise<{ success: boolean; data: CategoryDetailData }> => {
    const response = await api.get(`/categories/${id}/details`);
    return response.data;
  },

  // Get medicines by category
  getMedicinesByCategory: async (
    categoryId: string,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      manufacturer?: string;
      stockStatus?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    } = {}
  ): Promise<{ success: boolean; data: MedicinesByCategory }> => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(
      `/categories/${categoryId}/medicines?${params.toString()}`
    );
    return response.data;
  },

  // Create new category
  createCategory: async (data: CreateCategoryData) => {
    const response = await api.post("/categories", data);
    return response.data;
  },

  // Update category
  updateCategory: async (id: string, data: UpdateCategoryData) => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  // Delete category
  deleteCategory: async (id: string) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};

export default categoryApi;
