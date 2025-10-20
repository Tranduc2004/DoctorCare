import React, { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import {
  adminUpdateMedicine,
  adminGetMedicineById,
} from "../../api/adminMedicineApi";
import { adminGetActiveCategories } from "../../api/adminCategoryApi";

interface EditMedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  medicineId: string;
}

interface MedicineCategory {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

interface MedicineFormData {
  name: string;
  genericName: string;
  code: string;
  barcode: string;
  categoryId: string;
  activeIngredient: string;
  concentration: string;
  dosageForm: string;
  manufacturer: string;
  supplier: string;
  country: string;
  requiresPrescription: boolean;
  storageConditions: string;
  contraindications: string[];
  sideEffects: string[];
  packaging: {
    tabletsPerStrip: number;
    stripsPerBox: number;
    boxesPerCarton: number;
  };
  minStockLevel: number;
  maxStockLevel: number;
  reorderLevel: number;
}

const EditMedicineModal: React.FC<EditMedicineModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  medicineId,
}) => {
  const token = localStorage.getItem("adminToken") || "";
  const [categories, setCategories] = useState<MedicineCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<MedicineFormData>({
    name: "",
    genericName: "",
    code: "",
    barcode: "",
    categoryId: "",
    activeIngredient: "",
    concentration: "",
    dosageForm: "Viên nén",
    manufacturer: "",
    supplier: "",
    country: "Việt Nam",
    requiresPrescription: false,
    storageConditions: "Nơi khô ráo, tránh ánh sáng",
    contraindications: [""],
    sideEffects: [""],
    packaging: {
      tabletsPerStrip: 10,
      stripsPerBox: 10,
      boxesPerCarton: 10,
    },
    minStockLevel: 100,
    maxStockLevel: 10000,
    reorderLevel: 500,
  });

  // Fetch categories and medicine data
  const fetchData = useCallback(async () => {
    try {
      const [categoriesRes, medicineRes] = await Promise.all([
        adminGetActiveCategories(token),
        adminGetMedicineById(token, medicineId),
      ]);

      setCategories(categoriesRes.data.data || []);

      if (medicineRes.data.success && medicineRes.data.data) {
        const medicine = medicineRes.data.data;
        setFormData({
          name: medicine.name || "",
          genericName: medicine.genericName || "",
          code: medicine.code || "",
          barcode: medicine.barcode || "",
          categoryId: medicine.categoryId || "",
          activeIngredient: medicine.activeIngredient || "",
          concentration: medicine.concentration || "",
          dosageForm: medicine.dosageForm || "Viên nén",
          manufacturer: medicine.manufacturer || "",
          supplier: medicine.supplier || "",
          country: medicine.country || "Việt Nam",
          requiresPrescription: medicine.requiresPrescription || false,
          storageConditions:
            medicine.storageConditions || "Nơi khô ráo, tránh ánh sáng",
          contraindications:
            medicine.contraindications && medicine.contraindications.length > 0
              ? medicine.contraindications
              : [""],
          sideEffects:
            medicine.sideEffects && medicine.sideEffects.length > 0
              ? medicine.sideEffects
              : [""],
          packaging: {
            tabletsPerStrip: medicine.packaging?.tabletsPerStrip || 10,
            stripsPerBox: medicine.packaging?.stripsPerBox || 10,
            boxesPerCarton: medicine.packaging?.boxesPerCarton || 10,
          },
          minStockLevel: medicine.minStockLevel || 100,
          maxStockLevel: medicine.maxStockLevel || 10000,
          reorderLevel: medicine.reorderLevel || 500,
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Không thể tải dữ liệu thuốc");
    }
  }, [token, medicineId]);

  useEffect(() => {
    if (isOpen && medicineId) {
      fetchData();
    }
  }, [isOpen, medicineId, fetchData]);

  const handleInputChange = (
    field: string,
    value: string | number | boolean
  ) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...((prev as unknown as Record<string, unknown>)[parent] as Record<
            string,
            unknown
          >),
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError("Tên thuốc không được để trống");
      return false;
    }
    if (!formData.code.trim()) {
      setError("Mã thuốc không được để trống");
      return false;
    }
    if (!formData.categoryId) {
      setError("Vui lòng chọn danh mục");
      return false;
    }
    if (!formData.activeIngredient.trim()) {
      setError("Hoạt chất không được để trống");
      return false;
    }
    if (!formData.concentration.trim()) {
      setError("Nồng độ không được để trống");
      return false;
    }
    if (!formData.manufacturer.trim()) {
      setError("Nhà sản xuất không được để trống");
      return false;
    }
    if (
      formData.packaging.tabletsPerStrip <= 0 ||
      formData.packaging.stripsPerBox <= 0 ||
      formData.packaging.boxesPerCarton <= 0
    ) {
      setError("Quy cách đóng gói phải lớn hơn 0");
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Clean up form data
      const cleanedData: Partial<MedicineFormData> = {
        ...formData,
        contraindications: formData.contraindications.filter(
          (item) => item.trim() !== ""
        ),
        sideEffects: formData.sideEffects.filter((item) => item.trim() !== ""),
      };

      const selectedCategory = categories.find(
        (category) => category._id === formData.categoryId
      );
      const payload: any = {
        ...cleanedData,
        categoryName: selectedCategory?.name || undefined,
      };

      await adminUpdateMedicine(token, medicineId, payload);

      onSuccess();
      onClose();
    } catch (error: any) {
      setError(
        error?.response?.data?.error || "Có lỗi xảy ra khi cập nhật thuốc"
      );
      console.error("Error updating medicine:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Chỉnh sửa thuốc</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Thông tin cơ bản
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên thuốc *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="VD: Paracetamol"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên khoa học
                </label>
                <input
                  type="text"
                  value={formData.genericName}
                  onChange={(e) =>
                    handleInputChange("genericName", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="VD: Acetaminophen"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mã thuốc *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    handleInputChange("code", e.target.value.toUpperCase())
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="VD: PARA500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mã vạch
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => handleInputChange("barcode", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mã vạch sản phẩm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Danh mục *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    handleInputChange("categoryId", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dạng bào chế
                </label>
                <select
                  value={formData.dosageForm}
                  onChange={(e) =>
                    handleInputChange("dosageForm", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Viên nén">Viên nén</option>
                  <option value="Viên nang">Viên nang</option>
                  <option value="Viên sủi">Viên sủi</option>
                  <option value="Nước">Nước</option>
                  <option value="Kem">Kem</option>
                  <option value="Gel">Gel</option>
                  <option value="Tiêm">Tiêm</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hoạt chất *
                </label>
                <input
                  type="text"
                  value={formData.activeIngredient}
                  onChange={(e) =>
                    handleInputChange("activeIngredient", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="VD: Paracetamol"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nồng độ *
                </label>
                <input
                  type="text"
                  value={formData.concentration}
                  onChange={(e) =>
                    handleInputChange("concentration", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="VD: 500mg"
                />
              </div>
            </div>
          </div>

          {/* Packaging Specifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Quy cách đóng gói
            </h3>
            <p className="text-sm text-gray-600">
              Lưu ý: Viên là đơn vị gốc để tính tồn kho. Các đơn vị khác sẽ được
              quy đổi từ viên.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số viên trong 1 vỉ *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.packaging.tabletsPerStrip}
                  onChange={(e) =>
                    handleInputChange(
                      "packaging.tabletsPerStrip",
                      parseInt(e.target.value) || 1
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số vỉ trong 1 hộp *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.packaging.stripsPerBox}
                  onChange={(e) =>
                    handleInputChange(
                      "packaging.stripsPerBox",
                      parseInt(e.target.value) || 1
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số hộp trong 1 thùng *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.packaging.boxesPerCarton}
                  onChange={(e) =>
                    handleInputChange(
                      "packaging.boxesPerCarton",
                      parseInt(e.target.value) || 1
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Quy đổi:</strong> 1 thùng ={" "}
                {formData.packaging.boxesPerCarton *
                  formData.packaging.stripsPerBox *
                  formData.packaging.tabletsPerStrip}{" "}
                viên | 1 hộp ={" "}
                {formData.packaging.stripsPerBox *
                  formData.packaging.tabletsPerStrip}{" "}
                viên | 1 vỉ = {formData.packaging.tabletsPerStrip} viên
              </p>
            </div>
          </div>

          {/* Manufacturer Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Thông tin nhà sản xuất
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhà sản xuất *
                </label>
                <input
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) =>
                    handleInputChange("manufacturer", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="VD: Dược phẩm Traphaco"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhà cung cấp
                </label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) =>
                    handleInputChange("supplier", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tên nhà cung cấp"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quốc gia
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Stock Levels */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Mức tồn kho (theo viên)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tồn kho tối thiểu
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minStockLevel}
                  onChange={(e) =>
                    handleInputChange(
                      "minStockLevel",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mức đặt hàng lại
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.reorderLevel}
                  onChange={(e) =>
                    handleInputChange(
                      "reorderLevel",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tồn kho tối đa
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.maxStockLevel}
                  onChange={(e) =>
                    handleInputChange(
                      "maxStockLevel",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="requiresPrescription"
                checked={formData.requiresPrescription}
                onChange={(e) =>
                  handleInputChange("requiresPrescription", e.target.checked)
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="requiresPrescription"
                className="ml-2 block text-sm text-gray-900"
              >
                Yêu cầu toa bác sĩ
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Điều kiện bảo quản
              </label>
              <textarea
                value={formData.storageConditions}
                onChange={(e) =>
                  handleInputChange("storageConditions", e.target.value)
                }
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Bảo quản nơi khô ráo, tránh ánh sáng..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Đang cập nhật..." : "Cập nhật thuốc"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMedicineModal;
