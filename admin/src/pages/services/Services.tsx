import React, { useEffect, useMemo, useState } from "react";
import { Plus, Search, Edit, Trash2, Clock, X } from "lucide-react";
import { useAdminAuth } from "../../hooks/useAdminAuth";
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
      <div className="flex items-center justify-center h-72">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-transparent border-b-teal-500" />
          <div className="text-slate-600 text-lg">Đang tải…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Topbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Quản lý dịch vụ</h1>
        <button
          onClick={() => setIsCreateDialogOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-white
                     bg-gradient-to-r from-teal-500 to-blue-600
                     hover:from-teal-600 hover:to-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Thêm dịch vụ mới
        </button>
      </div>

      {/* Search */}
      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm kiếm dịch vụ…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm px-3 py-2 rounded-xl border border-slate-300
                       focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            Danh sách dịch vụ ({filteredServices.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                {[
                  "Ảnh",
                  "Tên dịch vụ",
                  "Mô tả",
                  "Giá",
                  "Thời gian",
                  "Trạng thái",
                  "Thao tác",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredServices.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-slate-500"
                  >
                    Không tìm thấy dịch vụ nào
                  </td>
                </tr>
              ) : (
                filteredServices.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {s.imageUrl || s.thumbnailUrl ? (
                        <img
                          src={s.thumbnailUrl || s.imageUrl}
                          alt={s.name}
                          className="h-12 w-12 rounded-lg object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                          <span className="text-slate-400 text-xs">
                            Không có ảnh
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                      {s.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                      {s.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-emerald-600">
                      {formatPrice(s.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      <div className="inline-flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {s.duration} phút
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleServiceStatus(s._id, s.isActive)}
                        className={classNames(
                          "inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-colors",
                          s.isActive
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                        )}
                      >
                        {s.isActive ? "Hoạt động" : "Không hoạt động"}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(s)}
                          className="text-slate-600 hover:text-slate-800 p-1 hover:bg-slate-100 rounded transition-colors"
                          aria-label="Sửa"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteService(s._id)}
                          className="text-rose-600 hover:text-rose-800 p-1 hover:bg-rose-50 rounded transition-colors"
                          aria-label="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
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
                  setFormData({ ...formData, duration: Number(e.target.value) })
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
                  setFormData({ ...formData, duration: Number(e.target.value) })
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
  );
};

export default Services;
