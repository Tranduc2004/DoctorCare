import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Clock } from "lucide-react";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import {
  adminGetAllServices,
  adminCreateService,
  adminUpdateService,
  adminDeleteService,
} from "../../api/adminApi";

interface Service {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateServiceData {
  name: string;
  description: string;
  price: number;
  duration: number;
}

const Services: React.FC = () => {
  const { token } = useAdminAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<CreateServiceData>({
    name: "",
    description: "",
    price: 0,
    duration: 30,
  });

  // Mock toast function (replace with your actual toast implementation)
  const toast = {
    success: (message: string) => {
      console.log("Success:", message);
      alert(`✅ ${message}`);
    },
    error: (message: string) => {
      console.error("Error:", message);
      alert(`❌ ${message}`);
    },
  };

  // Fetch services
  const fetchServices = async () => {
    if (!token) {
      toast.error("Không có quyền truy cập");
      return;
    }

    try {
      const response = await adminGetAllServices(token);
      setServices(response.data.data || []);
    } catch (error: any) {
      console.error("Error fetching services:", error);
      if (error.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn");
      } else {
        toast.error("Lỗi khi tải danh sách dịch vụ");
      }
    } finally {
      setLoading(false);
    }
  };

  // Create service
  const createService = async () => {
    if (!token) {
      toast.error("Không có quyền truy cập");
      return;
    }

    try {
      const response = await adminCreateService(token, formData);
      toast.success("Tạo dịch vụ thành công");
      setIsCreateDialogOpen(false);
      setFormData({ name: "", description: "", price: 0, duration: 30 });
      fetchServices();
    } catch (error: any) {
      console.error("Error creating service:", error);
      if (error.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn");
      } else {
        toast.error(error.response?.data?.message || "Không thể tạo dịch vụ");
      }
    }
  };

  // Update service
  const updateService = async () => {
    if (!editingService || !token) return;

    try {
      const response = await adminUpdateService(token, editingService._id, formData);
      toast.success("Cập nhật dịch vụ thành công");
      setIsEditDialogOpen(false);
      setEditingService(null);
      setFormData({ name: "", description: "", price: 0, duration: 30 });
      fetchServices();
    } catch (error: any) {
      console.error("Error updating service:", error);
      if (error.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn");
      } else {
        toast.error(error.response?.data?.message || "Không thể cập nhật dịch vụ");
      }
    }
  };

  // Delete service
  const deleteService = async (id: string) => {
    if (!token) {
      toast.error("Không có quyền truy cập");
      return;
    }

    if (!confirm("Bạn có chắc chắn muốn xóa dịch vụ này?")) return;

    try {
      await adminDeleteService(token, id);
      toast.success("Xóa dịch vụ thành công");
      fetchServices();
    } catch (error: any) {
      console.error("Error deleting service:", error);
      if (error.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn");
      } else {
        toast.error("Không thể xóa dịch vụ");
      }
    }
  };

  // Toggle service status
  const toggleServiceStatus = async (id: string, currentStatus: boolean) => {
    if (!token) {
      toast.error("Không có quyền truy cập");
      return;
    }

    try {
      await adminUpdateService(token, id, { isActive: !currentStatus });
      toast.success("Cập nhật trạng thái dịch vụ thành công");
      fetchServices();
    } catch (error: any) {
      console.error("Error toggling service status:", error);
      if (error.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn");
      } else {
        toast.error("Không thể cập nhật trạng thái dịch vụ");
      }
    }
  };

  // Handle edit
  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
    });
    setIsEditDialogOpen(true);
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Filter services
  const filteredServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchServices();
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
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
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
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Dịch vụ</h1>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm dịch vụ mới
          </button>
        </div>

        {/* Search Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Tìm kiếm dịch vụ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Services Table Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Danh sách dịch vụ ({filteredServices.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên dịch vụ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mô tả
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredServices.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Không tìm thấy dịch vụ nào
                    </td>
                  </tr>
                ) : (
                  filteredServices.map((service) => (
                    <tr key={service._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {service.name}
                      </td>
                      <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                        {service.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-green-600">
                        {formatPrice(service.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {service.duration} phút
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() =>
                            toggleServiceStatus(service._id, service.isActive)
                          }
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer transition-colors ${
                            service.isActive
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                          }`}
                        >
                          {service.isActive ? "Hoạt động" : "Không hoạt động"}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(service)}
                            className="text-gray-600 hover:text-gray-800 p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteService(service._id)}
                            className="text-red-600 hover:text-red-800 p-1 hover:bg-gray-100 rounded transition-colors"
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
        title="Thêm dịch vụ mới"
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Tên dịch vụ
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Nhập tên dịch vụ"
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
              placeholder="Nhập mô tả dịch vụ"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Giá (VND)
              </label>
              <input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: Number(e.target.value) })
                }
                placeholder="Nhập giá dịch vụ"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="duration"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Thời gian (phút)
              </label>
              <input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: Number(e.target.value) })
                }
                placeholder="Nhập thời gian"
                min="15"
                step="15"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsCreateDialogOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={createService}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tạo dịch vụ
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        title="Chỉnh sửa dịch vụ"
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="edit-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Tên dịch vụ
            </label>
            <input
              id="edit-name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Nhập tên dịch vụ"
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
              placeholder="Nhập mô tả dịch vụ"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="edit-price"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Giá (VND)
              </label>
              <input
                id="edit-price"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: Number(e.target.value) })
                }
                placeholder="Nhập giá dịch vụ"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="edit-duration"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Thời gian (phút)
              </label>
              <input
                id="edit-duration"
                type="number"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: Number(e.target.value) })
                }
                placeholder="Nhập thời gian"
                min="15"
                step="15"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsEditDialogOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={updateService}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Cập nhật
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Services;
