import React, { useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import {
  adminDeleteUser,
  adminGetDoctorsByStatus,
  adminUpdateUser,
  createDoctor,
  adminGetAllSpecialties,
} from "../../api/adminApi";
import type { User } from "../../types/user";

interface Specialty {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
}

const Doctors: React.FC = () => {
  const { token } = useAdminAuth();
  const [doctors, setDoctors] = useState<User[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [showEdit, setShowEdit] = useState<boolean>(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "" | "pending" | "approved" | "rejected"
  >("");

  const [formCreate, setFormCreate] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    specialty: "",
    experience: "",
    workplace: "",
    description: "",
    consultationFee: "",
  });

  const [formEdit, setFormEdit] = useState({
    name: "",
    email: "",
    phone: "",
    specialty: "",
    experience: "",
    workplace: "",
    description: "",
    consultationFee: "",
  });

  const [showReview, setShowReview] = useState<boolean>(false);
  const [reviewing, setReviewing] = useState<User | null>(null);

  // Fetch specialties
  const fetchSpecialties = async () => {
    if (!token) return;
    try {
      const response = await adminGetAllSpecialties(token);
      setSpecialties(response.data.data || []);
    } catch (error) {
      console.error("Error fetching specialties:", error);
    }
  };

  // Get specialty name by ID
  const getSpecialtyName = (specialtyId: string) => {
    const specialty = specialties.find((s) => s._id === specialtyId);
    return specialty ? specialty.name : "Không xác định";
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      setLoading(true);
      setError("");
      try {
        const [doctorsRes] = await Promise.all([
          adminGetDoctorsByStatus(token, statusFilter || undefined),
          fetchSpecialties(),
        ]);
        setDoctors(doctorsRes.data || []);
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
  }, [token, statusFilter]);

  const filtered = useMemo(() => {
    if (!query) return doctors;
    const q = query.toLowerCase();
    return doctors.filter((u) =>
      [u.name, u.email, u.username].some((v) =>
        (v || "").toLowerCase().includes(q)
      )
    );
  }, [doctors, query]);

  const handleDelete = async (id: string) => {
    if (!token) return;
    const ok = window.confirm("Bạn có chắc muốn xóa bác sĩ này?");
    if (!ok) return;
    try {
      await adminDeleteUser(token, id);
      setDoctors((prev) => prev.filter((p) => p._id !== id));
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
      specialty: "",
      experience: "",
      workplace: "",
      description: "",
      consultationFee: "",
    });
    setShowCreate(true);
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const payload: any = { ...formCreate };
      if (payload.experience)
        payload.experience = parseInt(payload.experience, 10);
      if (payload.consultationFee)
        payload.consultationFee = parseFloat(payload.consultationFee);
      const res = await createDoctor(token, payload);
      const created = res.data?.user || res.data;
      const newUser: User = { ...created, role: "doctor" };
      setDoctors((prev) => [newUser, ...prev]);
      setShowCreate(false);
    } catch (e: unknown) {
      const err = e as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      alert(
        err.response?.data?.message || err.message || "Tạo bác sĩ thất bại"
      );
    }
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setFormEdit({
      name: u.name || "",
      email: u.email || "",
      phone: (u as any).phone || "",
      specialty: (u as any).specialty || "",
      experience: (u as any).experience ? String((u as any).experience) : "",
      workplace: (u as any).workplace || "",
      description: (u as any).description || "",
      consultationFee: (u as any).consultationFee
        ? String((u as any).consultationFee)
        : "",
    });
    setShowEdit(true);
  };

  const openReview = (u: User) => {
    setReviewing(u);
    setShowReview(true);
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editing) return;
    try {
      const payload: any = { ...formEdit, role: "doctor" };
      if (payload.experience)
        payload.experience = parseInt(payload.experience, 10);
      if (payload.consultationFee)
        payload.consultationFee = parseFloat(payload.consultationFee);
      const res = await adminUpdateUser(token, editing._id, payload);
      const updated = res.data as User;
      setDoctors((prev) =>
        prev.map((p) =>
          p._id === editing._id ? { ...p, ...updated, role: "doctor" } : p
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className=" rounded-2xl shadow-xl p-8 mb-8 backdrop-blur-lg bg-white/90 border border-white/20">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Quản lý Bác sĩ
              </h1>
              <p className="text-gray-600 text-lg">
                Danh sách bác sĩ trong hệ thống ({filtered.length} bác sĩ)
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm kiếm tên, email, username..."
                  className="pl-12 pr-4 py-3 w-80 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-3 border-2 border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm"
              >
                <option value="">Tất cả</option>
                <option value="pending">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Từ chối</option>
              </select>
              <button
                onClick={openCreate}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Thêm bác sĩ
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            <div className="container mx-auto px-6 py-8 max-w-6xl">
              <div className="flex items-center justify-center h-64">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <div
                    className="absolute inset-0 w-20 h-20 border-4 border-transparent border-l-purple-600 rounded-full animate-spin opacity-70"
                    style={{
                      animationDelay: "0.5s",
                      animationDirection: "reverse",
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
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
        ) : (
          <div className=" rounded-2xl shadow-xl overflow-hidden backdrop-blur-lg bg-white/90 border border-white/20">
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 border-b border-gray-200">
              <div className="grid grid-cols-5 gap-4 font-semibold text-gray-700">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Tên bác sĩ
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Email & Chuyên khoa
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Trạng thái
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-4 8h4a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                    />
                  </svg>
                  Ngày tạo
                </div>
                <div className="text-center">Thao tác</div>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {filtered.map((u, index) => (
                <div
                  key={u._id}
                  className={`p-6 hover:bg-blue-50/50 transition-all duration-300 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                  }`}
                >
                  <div className="grid grid-cols-5 gap-4 items-center">
                    <div className="flex items-center gap-3">
                      {Boolean((u as any).avatar) ? (
                        <img
                          src={(u as any).avatar as any}
                          alt={u.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {(u.name || u.username || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">
                          {u.name || u.username || "(Không tên)"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {(u as any).specialty
                            ? getSpecialtyName((u as any).specialty)
                            : "Chưa có chuyên khoa"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-900">{u.email || "-"}</p>
                      <p className="text-sm text-gray-500">
                        {(u as any).specialty
                          ? getSpecialtyName((u as any).specialty)
                          : "Chưa có chuyên khoa"}
                      </p>
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          ((u as any).status || "pending") === "approved"
                            ? "bg-green-100 text-green-700"
                            : ((u as any).status || "pending") === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {((u as any).status || "pending") === "approved"
                          ? "Đã duyệt"
                          : ((u as any).status || "pending") === "rejected"
                          ? "Từ chối"
                          : "Chờ duyệt"}
                      </span>
                    </div>
                    <div>
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
                    </div>
                    <div className="flex justify-center gap-2">
                      {((u as any).status || "pending") === "pending" ? (
                        <button
                          onClick={() => openReview(u)}
                          className="px-4 py-2 rounded-lg border-2 border-amber-200 text-amber-700 text-sm font-medium hover:bg-amber-50 transition-all duration-300"
                        >
                          Xem đăng ký
                        </button>
                      ) : (
                        <a
                          href={`/users/${u._id}`}
                          className="px-4 py-2 rounded-lg border-2 border-blue-200 text-blue-700 text-sm font-medium hover:bg-blue-50 transition-all duration-300"
                        >
                          Chi tiết
                        </a>
                      )}
                      {((u as any).status || "pending") === "pending" && (
                        <>
                          <button
                            onClick={async () => {
                              if (!token) return;
                              await adminUpdateUser(token, u._id, {
                                role: "doctor",
                                status: "approved",
                              });
                              setDoctors((prev) =>
                                prev.map((d) =>
                                  d._id === u._id
                                    ? ({
                                        ...d,
                                        ...(d as any),
                                        status: "approved",
                                      } as any)
                                    : d
                                )
                              );
                            }}
                            className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-all"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={async () => {
                              if (!token) return;
                              await adminUpdateUser(token, u._id, {
                                role: "doctor",
                                status: "rejected",
                              });
                              setDoctors((prev) =>
                                prev.map((d) =>
                                  d._id === u._id
                                    ? ({
                                        ...d,
                                        ...(d as any),
                                        status: "rejected",
                                      } as any)
                                    : d
                                )
                              );
                            }}
                            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-all"
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => openEdit(u)}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-medium hover:from-emerald-600 hover:to-green-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center gap-1"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(u._id)}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-medium hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center gap-1"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-10 h-10 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Không có dữ liệu
                  </h3>
                  <p className="text-gray-500">
                    Chưa có bác sĩ nào trong hệ thống hoặc không tìm thấy kết
                    quả phù hợp
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Review Modal for pending doctor */}
        {showReview && reviewing && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl w-full max-w-3xl p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Thông tin đăng ký bác sĩ
                </h2>
                <button
                  onClick={() => {
                    setShowReview(false);
                    setReviewing(null);
                  }}
                  className="px-3 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  Đóng
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">Họ tên</div>
                  <div className="font-semibold text-gray-900">
                    {reviewing.name}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">Email</div>
                  <div className="font-semibold text-gray-900">
                    {reviewing.email}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">Số điện thoại</div>
                  <div className="font-semibold text-gray-900">
                    {(reviewing as any).phone || "-"}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">Chuyên khoa</div>
                  <div className="font-semibold text-gray-900">
                    {(reviewing as any).specialty
                      ? getSpecialtyName((reviewing as any).specialty as any)
                      : "-"}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">Kinh nghiệm (năm)</div>
                  <div className="font-semibold text-gray-900">
                    {(reviewing as any).experience ?? "-"}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">Nơi làm việc</div>
                  <div className="font-semibold text-gray-900">
                    {(reviewing as any).workplace || "-"}
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <div className="text-sm text-gray-500">Mô tả</div>
                  <div className="text-gray-800 whitespace-pre-line">
                    {(reviewing as any).description || "-"}
                  </div>
                </div>

                {(reviewing as any).avatar && (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-500">Ảnh đại diện</div>
                    <img
                      src={(reviewing as any).avatar as any}
                      alt={reviewing.name}
                      className="w-28 h-28 rounded-full object-cover border"
                    />
                  </div>
                )}

                {(reviewing as any).consultationFee !== undefined && (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-500">Phí tư vấn</div>
                    <div className="font-semibold text-gray-900">
                      {(reviewing as any).consultationFee}
                    </div>
                  </div>
                )}

                {(reviewing as any).license && (
                  <div className="space-y-2 md:col-span-2">
                    <div className="text-sm text-gray-500">
                      Bằng cấp/Giấy phép
                    </div>
                    {String((reviewing as any).license)
                      .toLowerCase()
                      .endsWith(".pdf") ? (
                      <a
                        href={(reviewing as any).license as any}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline"
                      >
                        Mở file PDF
                      </a>
                    ) : (
                      <img
                        src={(reviewing as any).license as any}
                        alt="license"
                        className="max-h-64 rounded-lg border"
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 mt-8">
                <button
                  onClick={async () => {
                    if (!token || !reviewing) return;
                    await adminUpdateUser(token, reviewing._id, {
                      role: "doctor",
                      status: "rejected",
                    });
                    setDoctors((prev) =>
                      prev.map((d) =>
                        d._id === reviewing._id
                          ? ({ ...(d as any), status: "rejected" } as any)
                          : d
                      )
                    );
                    setShowReview(false);
                    setReviewing(null);
                  }}
                  className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  Từ chối
                </button>
                <button
                  onClick={async () => {
                    if (!token || !reviewing) return;
                    await adminUpdateUser(token, reviewing._id, {
                      role: "doctor",
                      status: "approved",
                    });
                    setDoctors((prev) =>
                      prev.map((d) =>
                        d._id === reviewing._id
                          ? ({ ...(d as any), status: "approved" } as any)
                          : d
                      )
                    );
                    setShowReview(false);
                    setReviewing(null);
                  }}
                  className="px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                >
                  Duyệt
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl transform transition-all duration-300 scale-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Thêm bác sĩ mới
                </h2>
              </div>
              <form onSubmit={submitCreate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input
                    className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                    placeholder="Họ tên"
                    value={formCreate.name}
                    onChange={(e) =>
                      setFormCreate({ ...formCreate, name: e.target.value })
                    }
                    required
                  />
                  <input
                    className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                    placeholder="Email"
                    type="email"
                    value={formCreate.email}
                    onChange={(e) =>
                      setFormCreate({ ...formCreate, email: e.target.value })
                    }
                    required
                  />
                  <input
                    className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                    placeholder="Mật khẩu"
                    type="password"
                    value={formCreate.password}
                    onChange={(e) =>
                      setFormCreate({ ...formCreate, password: e.target.value })
                    }
                    required
                  />
                  <input
                    className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                    placeholder="Số điện thoại"
                    value={formCreate.phone}
                    onChange={(e) =>
                      setFormCreate({ ...formCreate, phone: e.target.value })
                    }
                  />
                  <select
                    className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                    value={formCreate.specialty}
                    onChange={(e) =>
                      setFormCreate({
                        ...formCreate,
                        specialty: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Chọn chuyên khoa</option>
                    {specialties
                      .filter((s) => s.isActive)
                      .map((specialty) => (
                        <option key={specialty._id} value={specialty._id}>
                          {specialty.name}
                        </option>
                      ))}
                  </select>
                  <input
                    className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                    placeholder="Kinh nghiệm (năm)"
                    value={formCreate.experience}
                    onChange={(e) =>
                      setFormCreate({
                        ...formCreate,
                        experience: e.target.value,
                      })
                    }
                  />
                  <input
                    className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                    placeholder="Nơi làm việc"
                    value={formCreate.workplace}
                    onChange={(e) =>
                      setFormCreate({
                        ...formCreate,
                        workplace: e.target.value,
                      })
                    }
                  />
                  <input
                    className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                    placeholder="Phí tư vấn"
                    value={formCreate.consultationFee}
                    onChange={(e) =>
                      setFormCreate({
                        ...formCreate,
                        consultationFee: e.target.value,
                      })
                    }
                  />
                  <textarea
                    className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 md:col-span-2"
                    placeholder="Mô tả"
                    value={formCreate.description}
                    onChange={(e) =>
                      setFormCreate({
                        ...formCreate,
                        description: e.target.value,
                      })
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
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Lưu
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEdit && editing && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl transform transition-all duration-300 scale-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Sửa thông tin bác sĩ
                </h2>
              </div>
              <form onSubmit={submitEdit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input
                    className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300"
                    placeholder="Họ tên"
                    value={formEdit.name}
                    onChange={(e) =>
                      setFormEdit({ ...formEdit, name: e.target.value })
                    }
                    required
                  />
                  <input
                    className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300"
                    placeholder="Email"
                    type="email"
                    value={formEdit.email}
                    onChange={(e) =>
                      setFormEdit({ ...formEdit, email: e.target.value })
                    }
                    required
                  />
                  <input
                    className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300"
                    placeholder="Số điện thoại"
                    value={formEdit.phone}
                    onChange={(e) =>
                      setFormEdit({ ...formEdit, phone: e.target.value })
                    }
                  />
                  <select
                    className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300"
                    value={formEdit.specialty}
                    onChange={(e) =>
                      setFormEdit({ ...formEdit, specialty: e.target.value })
                    }
                  >
                    <option value="">Chọn chuyên khoa</option>
                    {specialties
                      .filter((s) => s.isActive)
                      .map((specialty) => (
                        <option key={specialty._id} value={specialty._id}>
                          {specialty.name}
                        </option>
                      ))}
                  </select>
                  <input
                    className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300"
                    placeholder="Kinh nghiệm (năm)"
                    value={formEdit.experience}
                    onChange={(e) =>
                      setFormEdit({ ...formEdit, experience: e.target.value })
                    }
                  />
                  <input
                    className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300"
                    placeholder="Nơi làm việc"
                    value={formEdit.workplace}
                    onChange={(e) =>
                      setFormEdit({ ...formEdit, workplace: e.target.value })
                    }
                  />
                  <input
                    className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300"
                    placeholder="Phí tư vấn"
                    value={formEdit.consultationFee}
                    onChange={(e) =>
                      setFormEdit({
                        ...formEdit,
                        consultationFee: e.target.value,
                      })
                    }
                  />
                  <textarea
                    className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 md:col-span-2"
                    placeholder="Mô tả"
                    value={formEdit.description}
                    onChange={(e) =>
                      setFormEdit({ ...formEdit, description: e.target.value })
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
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold hover:from-emerald-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
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

export default Doctors;
