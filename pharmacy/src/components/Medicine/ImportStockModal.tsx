import React, { useState, useEffect } from "react";
import { X, Package } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface Medicine {
  _id: string;
  name: string;
  code: string;
  packaging: {
    tabletsPerStrip: number;
    stripsPerBox: number;
    boxesPerCarton: number;
  };
}

interface ImportStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportFormData {
  medicineId: string;
  batchNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  quantity: number;
  unit: "viên" | "vỉ" | "hộp" | "thùng";
  costPerUnit: number;
  notes: string;
}

const ImportStockModal: React.FC<ImportStockModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { token } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(
    null
  );

  const [formData, setFormData] = useState<ImportFormData>({
    medicineId: "",
    batchNumber: "",
    manufacturingDate: "",
    expiryDate: "",
    quantity: 1,
    unit: "hộp",
    costPerUnit: 0,
    notes: "",
  });

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_PHARMACY_API_URL}/medicines?limit=100`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setMedicines(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching medicines:", error);
      }
    };

    if (isOpen && token) {
      fetchMedicines();
    }
  }, [isOpen, token]);

  useEffect(() => {
    if (formData.medicineId) {
      const medicine = medicines.find((m) => m._id === formData.medicineId);
      setSelectedMedicine(medicine || null);
    } else {
      setSelectedMedicine(null);
    }
  }, [formData.medicineId, medicines]);

  const handleInputChange = (
    field: keyof ImportFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const calculateTablets = (): number => {
    if (!selectedMedicine) return 0;

    const { packaging } = selectedMedicine;
    const { quantity, unit } = formData;

    switch (unit) {
      case "viên":
        return quantity;
      case "vỉ":
        return quantity * packaging.tabletsPerStrip;
      case "hộp":
        return quantity * packaging.stripsPerBox * packaging.tabletsPerStrip;
      case "thùng":
        return (
          quantity *
          packaging.boxesPerCarton *
          packaging.stripsPerBox *
          packaging.tabletsPerStrip
        );
      default:
        return 0;
    }
  };

  const calculateTotalCost = (): number => {
    return formData.quantity * formData.costPerUnit;
  };

  const calculateCostPerTablet = (): number => {
    const tablets = calculateTablets();
    const totalCost = calculateTotalCost();
    return tablets > 0 ? totalCost / tablets : 0;
  };

  const validateForm = (): boolean => {
    if (!formData.medicineId) {
      setError("Vui lòng chọn thuốc");
      return false;
    }
    if (!formData.batchNumber.trim()) {
      setError("Số lô không được để trống");
      return false;
    }
    if (!formData.manufacturingDate) {
      setError("Ngày sản xuất không được để trống");
      return false;
    }
    if (!formData.expiryDate) {
      setError("Hạn sử dụng không được để trống");
      return false;
    }
    if (new Date(formData.expiryDate) <= new Date(formData.manufacturingDate)) {
      setError("Hạn sử dụng phải sau ngày sản xuất");
      return false;
    }
    if (formData.quantity <= 0) {
      setError("Số lượng phải lớn hơn 0");
      return false;
    }
    if (formData.costPerUnit <= 0) {
      setError("Giá nhập phải lớn hơn 0");
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
      const importData = {
        ...formData,
        manufacturingDate: new Date(formData.manufacturingDate).toISOString(),
        expiryDate: new Date(formData.expiryDate).toISOString(),
      };

      const response = await fetch(
        `${import.meta.env.VITE_PHARMACY_API_URL}/medicines/import`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(importData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          medicineId: "",
          batchNumber: "",
          manufacturingDate: "",
          expiryDate: "",
          quantity: 1,
          unit: "hộp",
          costPerUnit: 0,
          notes: "",
        });
      } else {
        setError(data.error || "Có lỗi xảy ra khi nhập hàng");
      }
    } catch (error) {
      setError("Có lỗi xảy ra khi nhập hàng");
      console.error("Error importing stock:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const tablets = calculateTablets();
  const totalCost = calculateTotalCost();
  const costPerTablet = calculateCostPerTablet();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">Nhập hàng</h2>
          </div>
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

          {/* Medicine Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn thuốc *
            </label>
            <select
              value={formData.medicineId}
              onChange={(e) => handleInputChange("medicineId", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Chọn thuốc cần nhập</option>
              {medicines.map((medicine) => (
                <option key={medicine._id} value={medicine._id}>
                  {medicine.name} ({medicine.code})
                </option>
              ))}
            </select>
          </div>

          {/* Packaging info */}
          {selectedMedicine && (
            <div className="bg-blue-50 p-4 rounded-md">
              <h4 className="font-medium text-blue-900 mb-2">
                Quy cách đóng gói:
              </h4>
              <p className="text-sm text-blue-800">
                1 vỉ = {selectedMedicine.packaging.tabletsPerStrip} viên | 1 hộp
                ={" "}
                {selectedMedicine.packaging.stripsPerBox *
                  selectedMedicine.packaging.tabletsPerStrip}{" "}
                viên | 1 thùng ={" "}
                {selectedMedicine.packaging.boxesPerCarton *
                  selectedMedicine.packaging.stripsPerBox *
                  selectedMedicine.packaging.tabletsPerStrip}{" "}
                viên
              </p>
            </div>
          )}

          {/* Batch Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số lô *
              </label>
              <input
                type="text"
                value={formData.batchNumber}
                onChange={(e) =>
                  handleInputChange("batchNumber", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="VD: LOT001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày sản xuất *
              </label>
              <input
                type="date"
                value={formData.manufacturingDate}
                onChange={(e) =>
                  handleInputChange("manufacturingDate", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hạn sử dụng *
              </label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) =>
                  handleInputChange("expiryDate", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số lượng *
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  handleInputChange("quantity", parseInt(e.target.value) || 1)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đơn vị *
              </label>
              <select
                value={formData.unit}
                onChange={(e) =>
                  handleInputChange(
                    "unit",
                    e.target.value as "viên" | "vỉ" | "hộp" | "thùng"
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="viên">Viên</option>
                <option value="vỉ">Vỉ</option>
                <option value="hộp">Hộp</option>
                <option value="thùng">Thùng</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giá nhập (/{formData.unit}) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.costPerUnit}
                onChange={(e) =>
                  handleInputChange(
                    "costPerUnit",
                    parseFloat(e.target.value) || 0
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>

          {/* Calculation Summary */}
          {selectedMedicine &&
            formData.quantity > 0 &&
            formData.costPerUnit > 0 && (
              <div className="bg-green-50 p-4 rounded-md">
                <h4 className="font-medium text-green-900 mb-2">
                  Thông tin nhập hàng:
                </h4>
                <div className="text-sm text-green-800 space-y-1">
                  <p>
                    • Số lượng: {formData.quantity} {formData.unit} ={" "}
                    <strong>{tablets} viên</strong>
                  </p>
                  <p>
                    • Tổng tiền:{" "}
                    <strong>{totalCost.toLocaleString("vi-VN")} VNĐ</strong>
                  </p>
                  <p>
                    • Giá vốn mỗi viên:{" "}
                    <strong>{costPerTablet.toLocaleString("vi-VN")} VNĐ</strong>
                  </p>
                </div>
              </div>
            )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ghi chú về lô hàng này..."
            />
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
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Đang nhập..." : "Nhập hàng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ImportStockModal;
