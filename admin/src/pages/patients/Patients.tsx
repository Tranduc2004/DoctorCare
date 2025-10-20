import React, { useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import {
  adminDeleteUser,
  adminGetUsersByRole,
  adminUpdateUser,
  createPatient,
} from "../../api/adminApi";
import type { User } from "../../types/user";
import {
  Users,
  UserCheck,
  Clock,
  TrendingUp,
  Search,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import Pagination from "../../components/common/Pagination";
import { usePagination } from "../../hooks/usePagination";

const Patients: React.FC = () => {
  const { token } = useAdminAuth();
  const [patients, setPatients] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [showEdit, setShowEdit] = useState<boolean>(false);
  const [editing, setEditing] = useState<User | null>(null);

  const [formCreate, setFormCreate] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
  });

  const [formEdit, setFormEdit] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      setLoading(true);
      setError("");
      try {
        const res = await adminGetUsersByRole(token, "patient");
        setPatients(res.data || []);
      } catch (e: unknown) {
        const err = e as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        setError(
          err.response?.data?.message || err.message || "Lỗi tải dữ liệu"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const filtered = useMemo(() => {
    if (!query) return patients;
    const q = query.toLowerCase();
    return patients.filter((u) =>
      [u.name, u.email, u.username].some((v) =>
        (v || "").toLowerCase().includes(q)
      )
    );
  }, [patients, query]);

  // Pagination
  const {
    currentPage,
    totalPages,
    paginatedData,
    totalItems,
    itemsPerPage,
    goToPage,
  } = usePagination({
    data: filtered,
    itemsPerPage: 10,
  });

  const handleDelete = async (id: string) => {
    if (!token) return;
    const ok = window.confirm("Bạn có chắc muốn xóa bệnh nhân này?");
    if (!ok) return;
    try {
      await adminDeleteUser(token, id);
      setPatients((prev) => prev.filter((p) => p._id !== id));
    } catch (e: unknown) {
      const err = e as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      alert(err.response?.data?.message || err.message || "Xóa thất bại");
    }
  };

  const openCreate = () => {
    setFormCreate({
      name: "",
      email: "",
      password: "",
      phone: "",
      dateOfBirth: "",
      gender: "",
      address: "",
    });
    setShowCreate(true);
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const payload = { ...formCreate } as any;
      if (!payload.password) delete payload.password;
      const res = await createPatient(token, payload);
      const created = res.data?.user || res.data;
      const newUser: User = { ...created, role: "patient" };
      setPatients((prev) => [newUser, ...prev]);
      setShowCreate(false);
    } catch (e: unknown) {
      const err = e as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      alert(
        err.response?.data?.message || err.message || "Tạo bệnh nhân thất bại"
      );
    }
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setFormEdit({
      name: u.name || "",
      email: u.email || "",
      phone: (u as any).phone || "",
      dateOfBirth: (u as any).dateOfBirth
        ? String((u as any).dateOfBirth).substring(0, 10)
        : "",
      gender: (u as any).gender || "",
      address: (u as any).address || "",
    });
    setShowEdit(true);
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editing) return;
    try {
      const payload: Record<string, unknown> = {
        ...formEdit,
        role: "patient",
      };
      if (!payload.dateOfBirth) delete payload.dateOfBirth;
      const res = await adminUpdateUser(token, editing._id, payload);
      const updated = res.data as User;
      setPatients((prev) =>
        prev.map((p) =>
          p._id === editing._id ? { ...p, ...updated, role: "patient" } : p
        )
      );
      setShowEdit(false);
      setEditing(null);
    } catch (e: unknown) {
      const err = e as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      alert(err.response?.data?.message || err.message || "Cập nhật thất bại");
    }
  };

  // Statistics calculations
  const stats = {
    total: filtered.length,
    active: filtered.filter(
      (p) =>
        p.createdAt &&
        new Date(p.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length,
    thisMonth: filtered.filter(
      (p) =>
        p.createdAt &&
        new Date(p.createdAt).getMonth() === new Date().getMonth()
    ).length,
    growth: Math.round(Math.random() * 20 + 5), // Placeholder for actual growth calculation
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Quản lý Bệnh nhân
                </h1>
                <p className="text-gray-600 text-lg">
                  Quản lý thông tin bệnh nhân trong hệ thống
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tìm kiếm bệnh nhân..."
                    className="pl-12 pr-4 py-3 w-80 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                  />
                </div>

                <button
                  onClick={openCreate}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Thêm bệnh nhân
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Tổng bệnh nhân
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Hoạt động gần đây
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.active}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tháng này</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.thisMonth}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tăng trưởng</p>
                <p className="text-3xl font-bold text-gray-900">
                  +{stats.growth}%
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-12">
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <div
                  className="absolute inset-0 w-20 h-20 border-4 border-transparent border-l-indigo-600 rounded-full animate-spin opacity-70"
                  style={{
                    animationDelay: "0.5s",
                    animationDirection: "reverse",
                  }}
                ></div>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-red-800 mb-2">
                Có lỗi xảy ra
              </h3>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            {/* Table Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  Danh sách bệnh nhân
                </h3>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{totalItems}</span> bệnh nhân
                  {totalPages > 1 && (
                    <span className="ml-2">
                      • Trang {currentPage} / {totalPages}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Bệnh nhân
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Điện thoại
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedData.map((u) => (
                    <tr
                      key={u._id}
                      className="hover:bg-blue-50/30 transition-all duration-300"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {(u.name || u.username || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {u.name || u.username || "(Không tên)"}
                            </p>
                            <p className="text-sm text-gray-500">
                              ID: {u._id.slice(-6)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-900">{u.email || "-"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-900">
                          {(u as any).phone || "-"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-900">
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString("vi-VN")
                            : "-"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleTimeString("vi-VN")
                            : ""}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openEdit(u)}
                            className="px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-medium hover:from-emerald-600 hover:to-green-600 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-1"
                          >
                            <Edit className="w-4 h-4" />
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(u._id)}
                            className="px-3 py-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-medium hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filtered.length === 0 && (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Không có bệnh nhân
                  </h3>
                  <p className="text-gray-500">
                    Chưa có bệnh nhân nào trong hệ thống hoặc không tìm thấy kết
                    quả phù hợp
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  showInfo={true}
                />
              </div>
            )}
          </div>
        )}

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/95 backdrop-blur-lg rounded-3xl w-full max-w-2xl p-8 shadow-2xl border border-white/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Thêm bệnh nhân mới
                </h2>
              </div>

              <form onSubmit={submitCreate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Họ tên *
                    </label>
                    <input
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                      placeholder="Nhập họ tên"
                      value={formCreate.name}
                      onChange={(e) =>
                        setFormCreate({ ...formCreate, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                      placeholder="Nhập email"
                      type="email"
                      value={formCreate.email}
                      onChange={(e) =>
                        setFormCreate({ ...formCreate, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mật khẩu *
                    </label>
                    <input
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                      placeholder="Nhập mật khẩu"
                      type="password"
                      value={formCreate.password}
                      onChange={(e) =>
                        setFormCreate({
                          ...formCreate,
                          password: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Số điện thoại
                    </label>
                    <input
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                      placeholder="Nhập số điện thoại"
                      value={formCreate.phone}
                      onChange={(e) =>
                        setFormCreate({ ...formCreate, phone: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Ngày sinh
                    </label>
                    <input
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                      type="date"
                      value={formCreate.dateOfBirth}
                      onChange={(e) =>
                        setFormCreate({
                          ...formCreate,
                          dateOfBirth: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Giới tính
                    </label>
                    <select
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                      value={formCreate.gender}
                      onChange={(e) =>
                        setFormCreate({ ...formCreate, gender: e.target.value })
                      }
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Địa chỉ
                  </label>
                  <input
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                    placeholder="Nhập địa chỉ"
                    value={formCreate.address}
                    onChange={(e) =>
                      setFormCreate({ ...formCreate, address: e.target.value })
                    }
                  />
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-300"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Tạo bệnh nhân
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEdit && editing && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/95 backdrop-blur-lg rounded-3xl w-full max-w-2xl p-8 shadow-2xl border border-white/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
                  <Edit className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  Sửa thông tin bệnh nhân
                </h2>
              </div>{" "}
              <form onSubmit={submitEdit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Họ tên *
                    </label>
                    <input
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300"
                      placeholder="Nhập họ tên"
                      value={formEdit.name}
                      onChange={(e) =>
                        setFormEdit({ ...formEdit, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300"
                      placeholder="Nhập email"
                      type="email"
                      value={formEdit.email}
                      onChange={(e) =>
                        setFormEdit({ ...formEdit, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Số điện thoại
                    </label>
                    <input
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300"
                      placeholder="Nhập số điện thoại"
                      value={formEdit.phone}
                      onChange={(e) =>
                        setFormEdit({ ...formEdit, phone: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Ngày sinh
                    </label>
                    <input
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300"
                      type="date"
                      value={formEdit.dateOfBirth}
                      onChange={(e) =>
                        setFormEdit({
                          ...formEdit,
                          dateOfBirth: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Giới tính
                    </label>
                    <select
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300"
                      value={formEdit.gender}
                      onChange={(e) =>
                        setFormEdit({ ...formEdit, gender: e.target.value })
                      }
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Địa chỉ
                  </label>
                  <input
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300"
                    placeholder="Nhập địa chỉ"
                    value={formEdit.address}
                    onChange={(e) =>
                      setFormEdit({ ...formEdit, address: e.target.value })
                    }
                  />
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEdit(false);
                      setEditing(null);
                    }}
                    className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-300"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold hover:from-emerald-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default Patients;
