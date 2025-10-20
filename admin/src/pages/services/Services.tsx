import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Clock,
  X,
  CheckCircle,
  Users,
  TrendingUp,
} from "lucide-react";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import Pagination from "../../components/common/Pagination";
import { usePagination } from "../../hooks/usePagination";
import {
  adminGetAllServices,
  adminCreateService,
  adminUpdateService,
  adminDeleteService,
} from "../../api/adminApi";

/* =========================
 * Types
 * =======================*/
interface Service {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // minutes
  imageUrl?: string;
  thumbnailUrl?: string;
  imagePublicId?: string;
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

/* =========================
 * UI helpers (Toast + Modal)
 * =======================*/
function classNames(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

type ToastState = {
  id: number;
  type: "success" | "error" | "info";
  message: string;
};

const Toasts: React.FC<{
  toasts: ToastState[];
  remove: (id: number) => void;
}> = ({ toasts, remove }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[60] space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={classNames(
            "rounded-xl px-4 py-3 shadow-lg text-white min-w-[260px]",
            t.type === "success" && "bg-emerald-600",
            t.type === "error" && "bg-rose-600",
            t.type === "info" && "bg-slate-700"
          )}
        >
          <div className="flex items-start gap-3">
            <span className="font-medium">{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              className="ml-auto/ inline-flex -mr-1 -mt-1 h-6 w-6 items-center justify-center rounded hover:bg-white/15"
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

const useToast = () => {
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const push = (type: ToastState["type"], message: string) => {
    const id = Date.now();
    setToasts((s) => [...s, { id, type, message }]);
    setTimeout(() => remove(id), 2600);
  };
  const remove = (id: number) => setToasts((s) => s.filter((x) => x.id !== id));
  return { toasts, push, remove };
};

import { createPortal } from "react-dom";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  overlayClassName?: string;
  panelClassName?: string;
};
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  overlayClassName = "bg-black/60 backdrop-blur-sm",
  panelClassName = "max-w-lg",
}) => {
  // ESC + lock scroll
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return createPortal(
    <div
      className={classNames(
        "fixed inset-0 z-50 p-4 flex items-center justify-center transition-opacity duration-200",
        overlayClassName
      )}
      onMouseDown={(e) => e.currentTarget === e.target && onClose()}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        className={classNames(
          "w-full bg-white rounded-2xl shadow-xl border border-slate-200",
          "transition-all duration-200 scale-100 opacity-100",
          panelClassName
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-600 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">{title}</h3>
            <button
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
};

/* =========================
 * Main Page
 * =======================*/
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

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const { toasts, push, remove } = useToast();
  const toast = {
    success: (m: string) => push("success", m),
    error: (m: string) => push("error", m),
    info: (m: string) => push("info", m),
  };

  /* ---------- Fetch ---------- */
  const fetchServices = async () => {
    if (!token) {
      toast.error("Không có quyền truy cập");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await adminGetAllServices(token);
      setServices(res?.data?.data || []);
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.status === 401
          ? "Phiên đăng nhập đã hết hạn"
          : "Lỗi khi tải danh sách dịch vụ"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /* ---------- Helpers ---------- */
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const filteredServices = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return services;
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description || "").toLowerCase().includes(q)
    );
  }, [services, searchTerm]);

  // Pagination
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedServices,
    totalItems,
    itemsPerPage,
    goToPage,
  } = usePagination({
    data: filteredServices,
    itemsPerPage: 8,
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", price: 0, duration: 30 });
    setImageFile(null);
    setImagePreview("");
  };

  const validateForm = (d: CreateServiceData) => {
    if (!d.name.trim()) return "Vui lòng nhập tên dịch vụ";
    if (d.price < 0) return "Giá dịch vụ không hợp lệ";
    if (d.duration < 1) return "Thời gian phải lớn hơn 0";
    return "";
  };

  /* ---------- CRUD ---------- */
  const createService = async () => {
    if (!token) return toast.error("Không có quyền truy cập");
    const msg = validateForm(formData);
    if (msg) return toast.error(msg);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("price", formData.price.toString());
      formDataToSend.append("duration", formData.duration.toString());

      if (imageFile) {
        formDataToSend.append("image", imageFile);
      }

      await adminCreateService(token, formDataToSend);
      toast.success("Tạo dịch vụ thành công");
      setIsCreateDialogOpen(false);
      resetForm();
      fetchServices();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Không thể tạo dịch vụ");
    }
  };

  const updateService = async () => {
    if (!editingService || !token) return;
    const msg = validateForm(formData);
    if (msg) return toast.error(msg);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("price", formData.price.toString());
      formDataToSend.append("duration", formData.duration.toString());

      if (imageFile) {
        formDataToSend.append("image", imageFile);
      }

      await adminUpdateService(token, editingService._id, formDataToSend);
      toast.success("Cập nhật dịch vụ thành công");
      setIsEditDialogOpen(false);
      setEditingService(null);
      resetForm();
      fetchServices();
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || "Không thể cập nhật dịch vụ"
      );
    }
  };

  const deleteService = async (id: string) => {
    if (!token) return toast.error("Không có quyền truy cập");
    if (!confirm("Bạn có chắc chắn muốn xóa dịch vụ này?")) return;
    try {
      await adminDeleteService(token, id);
      toast.success("Xóa dịch vụ thành công");
      fetchServices();
    } catch (error: any) {
      console.error(error);
      toast.error("Không thể xóa dịch vụ");
    }
  };

  const toggleServiceStatus = async (id: string, current: boolean) => {
    if (!token) return toast.error("Không có quyền truy cập");
    try {
      await adminUpdateService(token, id, { isActive: !current });
      toast.success("Cập nhật trạng thái dịch vụ thành công");
      fetchServices();
    } catch (error: any) {
      console.error(error);
      toast.error("Không thể cập nhật trạng thái dịch vụ");
    }
  };

  const handleEdit = (s: Service) => {
    setEditingService(s);
    setFormData({
      name: s.name,
      description: s.description,
      price: s.price,
      duration: s.duration,
    });
    setImageFile(null);
    setImagePreview(s.imageUrl || "");
    setIsEditDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast.error("Kích thước ảnh không được vượt quá 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn file ảnh");
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
  };

  /* ---------- UI ---------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex justify-center items-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-8">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
                Quản lý dịch vụ
              </h1>
              <p className="text-gray-600 text-lg">
                Quản lý các dịch vụ y tế được cung cấp tại phòng khám
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsCreateDialogOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 ease-out flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                Thêm dịch vụ mới
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-500 ease-out group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Tổng dịch vụ
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {services.length}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">
                    +15% từ tháng trước
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors duration-300">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-500 ease-out group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Đang hoạt động
                </p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {services.filter((s) => s.isActive).length}
                </p>
                <div className="flex items-center mt-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">
                    Sẵn sàng phục vụ
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors duration-300">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-500 ease-out group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Tạm dừng
                </p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {services.filter((s) => !s.isActive).length}
                </p>
                <div className="flex items-center mt-2">
                  <Clock className="w-4 h-4 text-orange-500 mr-1" />
                  <span className="text-sm text-orange-600 font-medium">
                    Cần kiểm tra
                  </span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition-colors duration-300">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-500 ease-out group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Giá trung bình
                </p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {services.length > 0
                    ? formatPrice(
                        services.reduce((sum, s) => sum + s.price, 0) /
                          services.length
                      )
                    : formatPrice(0)}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-purple-500 mr-1" />
                  <span className="text-sm text-purple-600 font-medium">
                    Cạnh tranh
                  </span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors duration-300">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm dịch vụ theo tên hoặc mô tả..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ease-out bg-gray-50 focus:bg-white"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <select className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all duration-300 ease-out min-w-[150px]">
                <option value="">Tất cả trạng thái</option>
                <option value="active">✅ Đang hoạt động</option>
                <option value="inactive">⏸️ Tạm dừng</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modern Services Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">
              Danh sách dịch vụ ({filteredServices.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Ảnh dịch vụ
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Thông tin dịch vụ
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Giá & Thời gian
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Users className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium text-lg">
                          Không có dịch vụ nào
                        </p>
                        <p className="text-gray-400 mt-1">
                          Hãy thêm dịch vụ đầu tiên của bạn
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredServices.map((s) => (
                    <tr
                      key={s._id}
                      className="hover:bg-gray-50 transition-colors duration-300 ease-out"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {s.imageUrl || s.thumbnailUrl ? (
                            <img
                              src={s.thumbnailUrl || s.imageUrl}
                              alt={s.name}
                              className="h-16 w-16 rounded-xl object-cover border border-gray-200 shadow-sm"
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 border border-gray-200 flex items-center justify-center">
                              <Users className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {s.name}
                            </p>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {s.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-emerald-600">
                            {formatPrice(s.price)}
                          </p>
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="w-4 h-4 mr-1" />
                            {s.duration} phút
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleServiceStatus(s._id, s.isActive)}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ease-out ${
                            s.isActive
                              ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200 hover:from-green-200 hover:to-emerald-200"
                              : "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200 hover:from-gray-200 hover:to-slate-200"
                          }`}
                        >
                          {s.isActive ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          {s.isActive ? "Hoạt động" : "Tạm dừng"}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {new Date(s.createdAt).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(s)}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                            title="Chỉnh sửa dịch vụ"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => deleteService(s._id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                            title="Xóa dịch vụ"
                          >
                            <Trash2 className="w-5 h-5" />
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

        {/* Create Modal */}
        <Modal
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          title="Thêm dịch vụ mới"
          overlayClassName="bg-black/60 backdrop-blur-sm"
          panelClassName="max-w-xl"
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700 mb-1"
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
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-slate-700 mb-1"
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
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Giá (VND)
                </label>
                <input
                  id="price"
                  type="number"
                  min={0}
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number(e.target.value) })
                  }
                  placeholder="Nhập giá dịch vụ"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label
                  htmlFor="duration"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Thời gian (phút)
                </label>
                <input
                  id="duration"
                  type="number"
                  min={15}
                  step={15}
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: Number(e.target.value),
                    })
                  }
                  placeholder="Nhập thời gian"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ảnh dịch vụ
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-slate-400 transition-colors">
                <div className="space-y-1 text-center">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="mx-auto h-32 w-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 hover:bg-rose-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <svg
                        className="mx-auto h-12 w-12 text-slate-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-slate-600">
                        <label
                          htmlFor="service-image"
                          className="relative cursor-pointer rounded-md font-medium text-teal-600 hover:text-teal-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500"
                        >
                          <span>Tải lên ảnh</span>
                          <input
                            id="service-image"
                            name="service-image"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleImageChange}
                          />
                        </label>
                        <p className="pl-1">hoặc kéo thả</p>
                      </div>
                      <p className="text-xs text-slate-500">
                        PNG, JPG, GIF tối đa 5MB
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsCreateDialogOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={createService}
                className="px-4 py-2 rounded-xl text-white font-medium bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700"
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
          overlayClassName="bg-black/60 backdrop-blur-sm"
          panelClassName="max-w-xl"
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="edit-name"
                className="block text-sm font-medium text-slate-700 mb-1"
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
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label
                htmlFor="edit-description"
                className="block text-sm font-medium text-slate-700 mb-1"
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
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="edit-price"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Giá (VND)
                </label>
                <input
                  id="edit-price"
                  type="number"
                  min={0}
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number(e.target.value) })
                  }
                  placeholder="Nhập giá dịch vụ"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-duration"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Thời gian (phút)
                </label>
                <input
                  id="edit-duration"
                  type="number"
                  min={15}
                  step={15}
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: Number(e.target.value),
                    })
                  }
                  placeholder="Nhập thời gian"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ảnh dịch vụ
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-slate-400 transition-colors">
                <div className="space-y-1 text-center">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="mx-auto h-32 w-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 hover:bg-rose-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <svg
                        className="mx-auto h-12 w-12 text-slate-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-slate-600">
                        <label
                          htmlFor="edit-service-image"
                          className="relative cursor-pointer rounded-md font-medium text-teal-600 hover:text-teal-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500"
                        >
                          <span>Tải lên ảnh</span>
                          <input
                            id="edit-service-image"
                            name="edit-service-image"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleImageChange}
                          />
                        </label>
                        <p className="pl-1">hoặc kéo thả</p>
                      </div>
                      <p className="text-xs text-slate-500">
                        PNG, JPG, GIF tối đa 5MB
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditDialogOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={updateService}
                className="px-4 py-2 rounded-xl text-white font-medium bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </Modal>

        {/* Toasts */}
        <Toasts toasts={toasts} remove={remove} />
      </div>
    </div>
  );
};

export default Services;
