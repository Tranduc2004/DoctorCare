import React, { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { categoryApi, type MedicineCategory } from "../../api/categoryApi";
import { medicineApi, type MedicineFormData } from "../../api/medicineApi";
import type { AlertColor } from "@mui/material";

interface EditMedicineModalProps {
  isOpen: boolean;
  medicineId: string | null;
  onClose: () => void;
  onSuccess: () => void;
  onNotify?: (message: string, severity?: AlertColor) => void;
}

const defaultForm: MedicineFormData = {
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
};

const EditMedicineModal: React.FC<EditMedicineModalProps> = ({
  isOpen,
  medicineId,
  onClose,
  onSuccess,
  onNotify,
}) => {
  const { token } = useAuth();
  const [categories, setCategories] = useState<MedicineCategory[]>([]);
  const [formData, setFormData] = useState<MedicineFormData>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoryApi.getApprovedCategories();
      setCategories(res.data || []);
    } catch (e) {
      console.error("Error fetching categories", e);
    }
  }, []);

  const fetchDetail = useCallback(async () => {
    if (!medicineId) return;
    try {
      const detailRes = await medicineApi.getMedicineById(medicineId);
      const res = detailRes as {
        success?: boolean;
        error?: string;
        data?: Partial<MedicineFormData>;
      };
      if (res.success === false) {
        throw new Error(res.error || "Không tải được dữ liệu thuốc");
      }
      const d = res.data || {};
      const mapped: MedicineFormData = {
        name: d.name || "",
        genericName: d.genericName || "",
        code: d.code || "",
        barcode: d.barcode || "",
        categoryId: d.categoryId || "",
        activeIngredient: d.activeIngredient || "",
        concentration: d.concentration || "",
        dosageForm: d.dosageForm || "Viên nén",
        manufacturer: d.manufacturer || "",
        supplier: d.supplier || "",
        country: d.country || "Việt Nam",
        requiresPrescription: Boolean(d.requiresPrescription),
        storageConditions: d.storageConditions || "Nơi khô ráo, tránh ánh sáng",
        contraindications: Array.isArray(d.contraindications)
          ? d.contraindications
          : [""],
        sideEffects: Array.isArray(d.sideEffects) ? d.sideEffects : [""],
        packaging: {
          tabletsPerStrip: d.packaging?.tabletsPerStrip || 10,
          stripsPerBox: d.packaging?.stripsPerBox || 10,
          boxesPerCarton: d.packaging?.boxesPerCarton || 10,
        },
        minStockLevel: d.minStockLevel ?? 100,
        maxStockLevel: d.maxStockLevel ?? 10000,
        reorderLevel: d.reorderLevel ?? 500,
      };
      setFormData(mapped);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Không tải được dữ liệu";
      setError(message);
    }
  }, [medicineId]);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchDetail();
    }
  }, [isOpen, fetchCategories, fetchDetail]);

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

    if (!validateForm()) return;
    if (!token) {
      setError("Vui lòng đăng nhập bằng tài khoản staff để cập nhật thuốc");
      return;
    }
    if (!medicineId) return;

    setLoading(true);
    setError("");
    try {
      const cleaned: MedicineFormData = {
        ...formData,
        contraindications: formData.contraindications?.filter(
          (s) => s.trim() !== ""
        ),
        sideEffects: formData.sideEffects?.filter((s) => s.trim() !== ""),
      };
      await medicineApi.updateMedicine(medicineId, cleaned);
      onSuccess();
      onClose();
      onNotify?.("Cập nhật thuốc thành công", "success");
    } catch (e: unknown) {
      let message =
        e instanceof Error ? e.message : "Có lỗi khi cập nhật thuốc";
      // Dịch các lỗi thường gặp từ backend
      if (/Only pending medicines can be edited/i.test(message)) {
        message = "Chỉ thuốc ở trạng thái 'chờ duyệt' mới được chỉnh sửa";
      } else if (/You can only edit medicines you created/i.test(message)) {
        message = "Bạn chỉ có thể chỉnh sửa thuốc do chính bạn tạo";
      } else if (/Staff authentication required/i.test(message)) {
        message = "Cần đăng nhập tài khoản nhân viên để chỉnh sửa thuốc";
      }
      setError(message);
      console.error("Error updating medicine:", e);
      onNotify?.(message, "error");
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

          {/* Thông tin cơ bản */}
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
                  value={formData.barcode || ""}
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

          {/* Quy cách đóng gói */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Quy cách đóng gói
            </h3>
            <p className="text-sm text-gray-600">
              Viên là đơn vị gốc để tính tồn kho.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số viên trong 1 vỉ *
                </label>
                <input
                  type="number"
                  min={1}
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
                  min={1}
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
                  min={1}
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

          {/* Thông tin NSX */}
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhà cung cấp
                </label>
                <input
                  type="text"
                  value={formData.supplier || ""}
                  onChange={(e) =>
                    handleInputChange("supplier", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          {/* Mức tồn */}
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
                  min={0}
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
                  min={0}
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
                  min={0}
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

          {/* Bổ sung */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="requiresPrescriptionEdit"
                checked={formData.requiresPrescription}
                onChange={(e) =>
                  handleInputChange("requiresPrescription", e.target.checked)
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="requiresPrescriptionEdit"
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
                value={formData.storageConditions || ""}
                onChange={(e) =>
                  handleInputChange("storageConditions", e.target.value)
                }
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Bảo quản nơi khô ráo, tránh ánh sáng..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chống chỉ định
                </label>
                <textarea
                  value={(formData.contraindications || []).join("\n")}
                  onChange={(e) =>
                    handleInputChange(
                      "contraindications",
                      e.target.value.split("\n")
                    )
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tác dụng phụ
                </label>
                <textarea
                  value={(formData.sideEffects || []).join("\n")}
                  onChange={(e) =>
                    handleInputChange("sideEffects", e.target.value.split("\n"))
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
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
              disabled={loading || !token}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMedicineModal;
