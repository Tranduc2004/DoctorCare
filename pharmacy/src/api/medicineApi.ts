import api from "./authApi";

// Types
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
  country: string;
  requiresPrescription: boolean;
  storageConditions?: string;
  contraindications?: string[];
  sideEffects?: string[];
  packaging: {
    tabletsPerStrip: number;
    stripsPerBox: number;
    boxesPerCarton: number;
  };
  minStockLevel: number;
  maxStockLevel: number;
  reorderLevel: number;
  status: "active" | "inactive" | "discontinued";
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockStats {
  totalMedicines: number;
  totalStockValue: number;
  stockByStatus: {
    in_stock: { count: number; value: number };
    low_stock: { count: number; value: number };
    out_of_stock: { count: number; value: number };
    overstock: { count: number; value: number };
  };
}

export interface MedicineFormData {
  name: string;
  genericName?: string;
  code: string;
  barcode?: string;
  categoryId: string;
  activeIngredient: string;
  concentration: string;
  dosageForm: string;
  manufacturer: string;
  supplier?: string;
  country: string;
  requiresPrescription: boolean;
  storageConditions?: string;
  contraindications?: string[];
  sideEffects?: string[];
  packaging: {
    tabletsPerStrip: number;
    stripsPerBox: number;
    boxesPerCarton: number;
  };
  minStockLevel: number;
  maxStockLevel: number;
  reorderLevel: number;
}

export interface MedicineQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  categoryId?: string;
}

export interface MedicineResponse {
  success: boolean;
  data: {
    medicines: Medicine[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
  error?: string;
}

export interface StatsResponse {
  success: boolean;
  data: StockStats;
  error?: string;
}

export interface SingleMedicineResponse {
  success: boolean;
  data: Medicine;
  error?: string;
}

// Medicine API class
class MedicineApi {
  async getMedicines(params?: MedicineQueryParams): Promise<MedicineResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (params) {
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.search) queryParams.append("search", params.search);
        if (params.status) queryParams.append("status", params.status);
        if (params.categoryId)
          queryParams.append("categoryId", params.categoryId);
      }

      const url = `/medicines${
        queryParams.toString() ? "?" + queryParams.toString() : ""
      }`;
      const response = await api.get(url);

      return {
        success: true,
        data: {
          medicines: response.data.data?.data || response.data.data || [],
          pagination: response.data.data?.pagination ||
            response.data.pagination || {
              currentPage: 1,
              totalPages: 1,
              totalItems: 0,
              itemsPerPage: 20,
            },
        },
      };
    } catch (error: unknown) {
      console.error("Error fetching medicines:", error);
      const axiosError = error as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      return {
        success: false,
        data: {
          medicines: [],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: 20,
          },
        },
        error:
          axiosError.response?.data?.error ||
          axiosError.message ||
          "Failed to fetch medicines",
      };
    }
  }

  async createMedicine(
    medicineData: MedicineFormData
  ): Promise<SingleMedicineResponse> {
    try {
      const response = await api.post(`/medicines`, medicineData);

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: unknown) {
      console.error("Error creating medicine:", error);
      const axiosError = error as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      throw {
        success: false,
        data: {} as Medicine,
        error:
          axiosError.response?.data?.error ||
          axiosError.message ||
          "Failed to create medicine",
      };
    }
  }

  async updateMedicine(
    id: string,
    medicineData: Partial<MedicineFormData>
  ): Promise<SingleMedicineResponse> {
    try {
      const response = await api.put(`/medicines/${id}`, medicineData);
      return { success: true, data: response.data.data };
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { error?: string }; status?: number };
        message?: string;
      };
      const message =
        axiosError.response?.data?.error ||
        axiosError.message ||
        "Failed to update medicine";
      // Ném Error chuẩn để UI có thể hiển thị message đúng
      throw new Error(message);
    }
  }

  async getMedicineById(id: string): Promise<SingleMedicineResponse> {
    try {
      const response = await api.get(`/medicines/${id}`);
      return { success: true, data: response.data.data };
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      return {
        success: false,
        data: {} as Medicine,
        error:
          axiosError.response?.data?.error ||
          axiosError.message ||
          "Failed to get medicine",
      };
    }
  }

  async deleteMedicine(
    id: string
  ): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
    try {
      const response = await api.delete(`/medicines/${id}`);
      return { success: true, data: response.data.data };
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      return {
        success: false,
        error:
          axiosError.response?.data?.error ||
          axiosError.message ||
          "Failed to delete medicine",
      };
    }
  }

  async getStockStatistics(): Promise<StatsResponse> {
    try {
      const response = await api.get(`/medicines/statistics/stock`);

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: unknown) {
      console.error("Error fetching stock statistics:", error);
      const axiosError = error as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      return {
        success: false,
        data: {
          totalMedicines: 0,
          totalStockValue: 0,
          stockByStatus: {
            in_stock: { count: 0, value: 0 },
            low_stock: { count: 0, value: 0 },
            out_of_stock: { count: 0, value: 0 },
            overstock: { count: 0, value: 0 },
          },
        },
        error:
          axiosError.response?.data?.error ||
          axiosError.message ||
          "Failed to fetch stock statistics",
      };
    }
  }
}

export const medicineApi = new MedicineApi();
