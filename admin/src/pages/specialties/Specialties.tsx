import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import {
  adminGetAllSpecialties,
  adminCreateSpecialty,
  adminUpdateSpecialty,
  adminDeleteSpecialty,
} from "../../api/adminApi";

interface Specialty {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateSpecialtyData {
  name: string;
  description: string;
}

const Specialties: React.FC = () => {
  const { token } = useAdminAuth();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(
    null
  );
  const [formData, setFormData] = useState<CreateSpecialtyData>({
    name: "",
    description: "",
  });

  // Mock toast function (replace with your actual toast implementation)
  const toast = {
    success: (message: string) => {
      // Replace with your actual toast library
      console.log("Success:", message);
      alert(`✅ ${message}`);
    },
    error: (message: string) => {
      // Replace with your actual toast library
      console.error("Error:", message);
      alert(`❌ ${message}`);
    },
  };

  // Fetch specialties
  const fetchSpecialties = async () => {
    if (!token) {
      toast.error("Không có quyền truy cập");
      return;
    }

    try {
      const response = await adminGetAllSpecialties(token);
      setSpecialties(response.data.data || []);
    } catch (error: any) {
      console.error("Error fetching specialties:", error);
      if (error.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn");
      } else {
        toast.error("Lỗi khi tải danh sách chuyên khoa");
      }
    } finally {
      setLoading(false);
    }
  };

  // Create specialty
  const createSpecialty = async () => {
    if (!token) {
      toast.error("Không có quyền truy cập");
      return;
    }

    try {
      const response = await adminCreateSpecialty(token, formData);
      toast.success("Tạo chuyên khoa thành công");
      setIsCreateDialogOpen(false);
      setFormData({ name: "", description: "" });
      fetchSpecialties();
    } catch (error: any) {
      console.error("Error creating specialty:", error);
      if (error.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn");
      } else {
        toast.error(error.response?.data?.message || "Không thể tạo chuyên khoa");
      }
    }
  };

  // Update specialty
  const updateSpecialty = async () => {
    if (!editingSpecialty || !token) return;

    try {
      const response = await adminUpdateSpecialty(token, editingSpecialty._id, formData);
      toast.success("Cập nhật chuyên khoa thành công");
      setIsEditDialogOpen(false);
      setEditingSpecialty(null);
      setFormData({ name: "", description: "" });
      fetchSpecialties();
    } catch (error: any) {
      console.error("Error updating specialty:", error);
      if (error.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn");
      } else {
        toast.error(error.response?.data?.message || "Không thể cập nhật chuyên khoa");
      }
    }
  };

  // Delete specialty
  const deleteSpecialty = async (id: string) => {
    if (!token) {
      toast.error("Không có quyền truy cập");
      return;
    }

    if (!confirm("Bạn có chắc chắn muốn xóa chuyên khoa này?")) return;

    try {
      await adminDeleteSpecialty(token, id);
      toast.success("Xóa chuyên khoa thành công");
      fetchSpecialties();
    } catch (error: any) {
      console.error("Error deleting specialty:", error);
      if (error.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn");
      } else {
        toast.error("Không thể xóa chuyên khoa");
      }
    }
  };

  // Toggle specialty status
  const toggleSpecialtyStatus = async (specialty: Specialty) => {
    if (!token) {
      toast.error("Không có quyền truy cập");
      return;
    }

    try {
      await adminUpdateSpecialty(token, specialty._id, { isActive: !specialty.isActive });
      toast.success(
        `${
          specialty.isActive ? "Vô hiệu hóa" : "Kích hoạt"
        } chuyên khoa thành công`
      );
      fetchSpecialties();
    } catch (error: any) {
      console.error("Error toggling specialty status:", error);
      if (error.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn");
      } else {
        toast.error("Không thể cập nhật trạng thái");
      }
    }
  };

  // Handle edit
  const handleEdit = (specialty: Specialty) => {
    setEditingSpecialty(specialty);
    setFormData({
      name: specialty.name,
      description: specialty.description,
    });
    setIsEditDialogOpen(true);
  };

  // Filter specialties
  const filteredSpecialties = specialties.filter(
    (specialty) =>
      specialty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      specialty.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchSpecialties();
  }, []);

  // Modal component
  const Modal = ({
    isOpen,
    onClose,
    title,
    children,
  }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
  }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <div className="ml-3 text-lg text-gray-600">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Quản lý Chuyên khoa
          </h1>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm chuyên khoa
          </button>
        </div>

        {/* Search Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Tìm kiếm
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm chuyên khoa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên chuyên khoa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mô tả
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSpecialties.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Không tìm thấy chuyên khoa nào
                    </td>
                  </tr>
                ) : (
                  filteredSpecialties.map((specialty) => (
                    <tr key={specialty._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {specialty.name}
                      </td>
                      <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                        {specialty.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            specialty.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {specialty.isActive ? "Hoạt động" : "Vô hiệu hóa"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {new Date(specialty.createdAt).toLocaleDateString(
                          "vi-VN"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleSpecialtyStatus(specialty)}
                            className="text-blue-600 hover:text-blue-800 px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                          >
                            {specialty.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                          </button>
                          <button
                            onClick={() => handleEdit(specialty)}
                            className="text-gray-600 hover:text-gray-800 p-1 hover:bg-gray-100 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteSpecialty(specialty._id)}
                            className="text-red-600 hover:text-red-800 p-1 hover:bg-gray-100 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        title="Thêm chuyên khoa mới"
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Tên chuyên khoa
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Nhập tên chuyên khoa"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Mô tả
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Nhập mô tả chuyên khoa"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsCreateDialogOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={createSpecialty}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Thêm
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        title="Chỉnh sửa chuyên khoa"
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="edit-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Tên chuyên khoa
            </label>
            <input
              id="edit-name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Nhập tên chuyên khoa"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="edit-description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Mô tả
            </label>
            <textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Nhập mô tả chuyên khoa"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsEditDialogOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={updateSpecialty}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Cập nhật
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Specialties;
