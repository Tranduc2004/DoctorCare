import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  FileText,
  Calendar,
  User,
  Phone,
  Mail,
  Clock,
  Eye,
  Filter,
  ChevronRight,
  Plus,
  Edit3,
  X,
  RefreshCw,
} from "lucide-react";
import {
  getMedicalRecordByAppointment,
  MedicalRecord,
} from "../../../api/medicalRecordApi";
import { getAppointmentsByDoctor } from "../../../api/appointmentApi";
import { useAuth } from "../../../contexts/AuthContext";
import MedicalRecordForm from "../../../components/MedicalRecordForm";

// Define Appointment interface similar to Appointments.tsx
interface Appointment {
  _id: string;
  patientId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
  };
  patientInfo?: {
    name: string;
    phone: string;
    email: string;
  };
  appointmentTime: string;
  status: string;
  symptoms: string;
  notes?: string;
  doctorId: string;
  createdAt: string;
  updatedAt: string;
}

const MedicalRecords: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<
    Appointment[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [medicalRecordModalOpen, setMedicalRecordModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [appointmentsWithMedicalRecord, setAppointmentsWithMedicalRecord] =
    useState<Set<string>>(new Set());

  // Get doctor ID from auth context
  const doctorId = user?._id || "";

  useEffect(() => {
    if (doctorId) {
      fetchAppointments();
    }
  }, [doctorId]);

  useEffect(() => {
    filterAppointments();
  }, [searchTerm, statusFilter, appointments]);

  useEffect(() => {
    if (appointments.length > 0) {
      loadMedicalRecordStatus();
    }
  }, [appointments]);

  const fetchAppointments = async () => {
    if (!doctorId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getAppointmentsByDoctor(doctorId);
      // Filter only completed appointments for medical records
      const completedAppointments = data.filter(
        (appointment: Appointment) => appointment.status === "completed"
      );
      setAppointments(completedAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkMedicalRecordExists = useCallback(
    async (appointmentId: string): Promise<boolean> => {
      try {
        const response = await getMedicalRecordByAppointment(appointmentId);
        return !!response;
      } catch (error) {
        return false;
      }
    },
    []
  );

  const loadMedicalRecordStatus = useCallback(async () => {
    const recordSet = new Set<string>();
    for (const appointment of appointments) {
      const hasRecord = await checkMedicalRecordExists(appointment._id);
      if (hasRecord) {
        recordSet.add(appointment._id);
      }
    }
    setAppointmentsWithMedicalRecord(recordSet);
  }, [appointments, checkMedicalRecordExists]);

  const filterAppointments = () => {
    let filtered = appointments;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((appointment) => {
        const patientName =
          appointment.patientInfo?.name || appointment.patientId.name;
        const patientEmail =
          appointment.patientInfo?.email || appointment.patientId.email;
        const patientPhone =
          appointment.patientInfo?.phone || appointment.patientId.phone;

        return (
          patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patientPhone.includes(searchTerm) ||
          appointment.symptoms.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Filter by medical record status
    if (statusFilter === "has_record") {
      filtered = filtered.filter((appointment) =>
        appointmentsWithMedicalRecord.has(appointment._id)
      );
    } else if (statusFilter === "no_record") {
      filtered = filtered.filter(
        (appointment) => !appointmentsWithMedicalRecord.has(appointment._id)
      );
    }

    setFilteredAppointments(filtered);
  };

  const handleOpenMedicalRecord = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setMedicalRecordModalOpen(true);
  };

  const handleCloseMedicalRecord = () => {
    setMedicalRecordModalOpen(false);
    setSelectedAppointment(null);
  };

  const handleSaveMedicalRecord = (record: MedicalRecord) => {
    // Add appointment to the set of appointments with medical records
    if (selectedAppointment) {
      setAppointmentsWithMedicalRecord(
        (prev) => new Set([...prev, selectedAppointment._id])
      );
    }
    handleCloseMedicalRecord();
  };

  const getMedicalRecordButtonType = (appointment: Appointment) => {
    const hasRecord = appointmentsWithMedicalRecord.has(appointment._id);
    return hasRecord ? "view" : "create";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRecordStatusBadge = (hasRecord: boolean) => {
    if (hasRecord) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Đã có hồ sơ
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          Chưa có hồ sơ
        </span>
      );
    }
  };

  /** UI */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-emerald-50">
      {/* Top bar */}
      <header className="border-b border-slate-200 bg-gradient-to-r from-blue-500 to-teal-400">
        <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Quản lý Hồ sơ Bệnh án
            </h1>
            <p className="text-white/90">
              Danh sách lịch khám đã hoàn thành và quản lý hồ sơ bệnh án
            </p>
          </div>
          <button
            onClick={fetchAppointments}
            className="inline-flex items-center gap-2 rounded-lg border border-teal-300 bg-gradient-to-r from-teal-500 to-blue-500 px-4 py-2 text-sm font-medium text-white hover:from-teal-600 hover:to-blue-600 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <RefreshCw className="h-4 w-4" /> Tải lại
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-6">
        {/* Filters */}
        <section className="mb-6 rounded-xl border border-teal-200 bg-white p-5 shadow-lg backdrop-blur-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="relative">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                <Search className="mr-1 inline h-4 w-4 text-teal-500" />
                Tìm kiếm (tên/sđt/email/triệu chứng)
              </label>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="VD: Nguyễn A, 0909..., đau đầu"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-100 transition-all duration-200"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                <Filter className="mr-1 inline h-4 w-4 text-teal-500" />
                Trạng thái hồ sơ
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-100 transition-all duration-200"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="has_record">Đã có hồ sơ</option>
                <option value="no_record">Chưa có hồ sơ</option>
              </select>
            </div>
          </div>

          {(statusFilter !== "all" || searchTerm) && (
            <div className="mt-4 flex items-center gap-2 border-t border-teal-200 pt-4">
              <Filter className="h-4 w-4 text-teal-600" />
              <span className="text-sm text-gray-600">Đang lọc:</span>
              {searchTerm && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 border border-gray-200">
                  "{searchTerm}"
                </span>
              )}
              {statusFilter !== "all" && (
                <span className="rounded-full bg-teal-100 px-3 py-1 text-sm text-teal-700 border border-teal-200">
                  {statusFilter === "has_record" ? "Đã có hồ sơ" : "Chưa có hồ sơ"}
                </span>
              )}
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="ml-auto text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </section>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        )}

        {/* Appointment List */}
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <FileText className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có lịch khám nào</h3>
            <p className="text-gray-500">Không có lịch khám nào phù hợp với bộ lọc hiện tại</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => {
              const hasRecord = appointmentsWithMedicalRecord.has(
                appointment._id
              );
              const buttonType = getMedicalRecordButtonType(appointment);
              const patientName =
                appointment.patientInfo?.name || appointment.patientId.name;
              const patientEmail =
                appointment.patientInfo?.email || appointment.patientId.email;
              const patientPhone =
                appointment.patientInfo?.phone || appointment.patientId.phone;

              return (
                <div
                  key={appointment._id}
                  className="overflow-hidden rounded-xl border border-teal-200 bg-white shadow-lg transition-all duration-200 hover:shadow-xl hover:border-teal-300"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-4 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-teal-500 to-blue-500">
                            {appointment.patientId.avatar ? (
                              <img
                                src={appointment.patientId.avatar}
                                alt={patientName}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <User className="h-5 w-5 text-white" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {patientName}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                Đã hoàn thành
                              </span>
                              {getRecordStatusBadge(hasRecord)}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4 text-teal-500" />
                            <span className="font-medium">Ngày khám:</span>
                            <span>{formatDate(appointment.appointmentTime)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-4 w-4 text-teal-500" />
                            <span className="font-medium">SĐT:</span>
                            <span>{patientPhone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-4 w-4 text-teal-500" />
                            <span className="font-medium">Email:</span>
                            <span className="truncate">{patientEmail}</span>
                          </div>
                        </div>

                        {appointment.symptoms && (
                          <div className="mt-4 rounded-lg border border-teal-100 bg-teal-50 p-3">
                            <div className="flex items-start gap-2">
                              <FileText className="mt-0.5 h-4 w-4 text-teal-600" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-teal-800">Triệu chứng:</p>
                                <p className="mt-1 text-sm text-teal-700">{appointment.symptoms}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {appointment.notes && (
                          <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                            <div className="flex items-start gap-2">
                              <FileText className="mt-0.5 h-4 w-4 text-gray-600" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800">Ghi chú:</p>
                                <p className="mt-1 text-sm text-gray-700">{appointment.notes}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="ml-6">
                        <button
                          onClick={() => handleOpenMedicalRecord(appointment)}
                          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 hover:shadow-lg ${
                            buttonType === "view"
                              ? "bg-gradient-to-r from-blue-500 to-teal-500 text-white hover:from-blue-600 hover:to-teal-600"
                              : "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
                          }`}
                        >
                          {buttonType === "view" ? (
                            <>
                              <Eye className="h-4 w-4" />
                              Xem hồ sơ
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4" />
                              Tạo hồ sơ
                            </>
                          )}
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                      <div className="text-xs text-gray-500">
                        Mã lịch khám: {appointment._id.slice(-8)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Medical Record Modal */}
      {medicalRecordModalOpen && selectedAppointment && (
        <div className="fixed inset-0 bg-white/80 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Hồ sơ bệnh án -{" "}
                {selectedAppointment.patientInfo?.name ||
                  selectedAppointment.patientId.name}
              </h2>
              <button
                onClick={handleCloseMedicalRecord}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <MedicalRecordForm
                appointmentId={selectedAppointment._id}
                isOpen={medicalRecordModalOpen}
                onClose={handleCloseMedicalRecord}
                onSave={handleSaveMedicalRecord}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;
