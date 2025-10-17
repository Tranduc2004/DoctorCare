import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Calendar,
  User,
  Stethoscope,
  Eye,
  Clock,
  X,
  HeartPulse,
  ClipboardList,
  Pill,
  BookOpen,
} from "lucide-react";
import {
  MedicalRecord,
  getPatientMedicalRecords,
  getPatientMedicalRecordDetail,
} from "../../../api/medicalRecordApi";
import { useAuth } from "../../../contexts/AuthContext";

// Doctor (populated) interface
interface PopulatedDoctor {
  _id: string;
  name: string;
  specialty: string;
  workplace?: string;
}

const PatientMedicalRecords: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDetail, setShowDetail] = useState(false);

  const loadMedicalRecords = useCallback(async () => {
    if (!user?._id) return;
    setLoading(true);
    setError("");
    try {
      const data = await getPatientMedicalRecords(user._id);
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading medical records:", err);
      setError("Không thể tải hồ sơ bệnh án. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    loadMedicalRecords();
  }, [loadMedicalRecords]);

  const handleViewDetail = async (recordId: string) => {
    if (!user?._id) return;
    try {
      setDetailLoading(true);
      setError("");
      const detail = await getPatientMedicalRecordDetail(recordId, user._id);
      setSelectedRecord(detail);
      setShowDetail(true);
    } catch (err) {
      console.error("Error loading record detail:", err);
      setError("Không thể tải chi tiết hồ sơ bệnh án.");
    } finally {
      setDetailLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "--/--/----";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /* -------------------------- UI Fragments --------------------------- */

  const Header = () => (
    <div className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-500 to-emerald-500 text-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-white/20 grid place-items-center">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Hồ sơ bệnh án của tôi</h1>
            <p className="text-white/90">Xem lại các lần khám đã hoàn thành</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <StatPill label="Tổng hồ sơ" value={records.length.toString()} />
          <StatPill
            label="Đã hoàn thành"
            value={records.filter((r) => r.completedAt).length.toString()}
          />
        </div>
      </div>
    </div>
  );

  const StatPill = ({ label, value }: { label: string; value: string }) => (
    <div className="rounded-xl bg-white/15 px-4 py-2 text-sm">
      <div className="opacity-90">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );

  const SkeletonList = () => (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="absolute left-[18px] top-0 h-full w-[2px] bg-slate-100" />
          <div className="flex items-start gap-4">
            <div className="mt-1 h-4 w-4 rounded-full bg-teal-200" />
            <div className="w-full animate-pulse">
              <div className="h-5 w-56 bg-slate-200 rounded mb-2" />
              <div className="h-4 w-40 bg-slate-100 rounded mb-4" />
              <div className="h-4 w-full bg-slate-100 rounded mb-2" />
              <div className="h-4 w-2/3 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="text-center rounded-2xl border border-slate-200 bg-white p-10">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-teal-50 text-teal-600">
        <FileText className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">Chưa có hồ sơ</h3>
      <p className="mt-1 text-slate-600">
        Bạn chưa có hồ sơ bệnh án nào đã hoàn thành.
      </p>
    </div>
  );

  const Row = ({ record }: { record: MedicalRecord }) => {
    const doc = record.doctor as unknown as PopulatedDoctor;
    const docName = doc?.name || "Chưa xác định";
    const spec = doc?.specialty || "Chưa xác định";
    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
        {/* timeline line */}
        <div className="absolute left-[18px] top-0 h-full w-[2px] bg-slate-100" />
        <div className="flex items-start gap-4">
          <div className="mt-1 h-4 w-4 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 ring-4 ring-teal-50" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="inline-flex items-center gap-2 text-slate-900 font-semibold">
                <User className="h-5 w-5 text-slate-400" />
                <span>BS. {docName}</span>
              </div>
              <div className="inline-flex items-center gap-2 text-slate-600">
                <Stethoscope className="h-5 w-5 text-slate-400" />
                <span>{spec}</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-2 text-slate-600">
                <Calendar className="h-4 w-4 text-slate-400" />
                Ngày khám: {formatDate(record.createdAt)}
              </span>
              {record.completedAt && (
                <span className="inline-flex items-center gap-2 text-emerald-700">
                  <Clock className="h-4 w-4 text-emerald-500" />
                  Hoàn thành: {formatDate(record.completedAt)}
                </span>
              )}
              {record.consultationType && (
                <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-teal-700">
                  {record.consultationType === "online"
                    ? "Trực tuyến"
                    : "Tại phòng khám"}
                </span>
              )}
            </div>

            {/* brief info */}
            <div className="mt-3 grid gap-2 text-sm">
              {(record.finalDiagnosis ||
                record.diagnosis?.primaryDiagnosis ||
                (typeof record.diagnosis === "string"
                  ? record.diagnosis
                  : "")) && (
                <div className="text-slate-700">
                  <span className="font-medium text-slate-900">Chẩn đoán:</span>{" "}
                  {record.finalDiagnosis ||
                    record.diagnosis?.primaryDiagnosis ||
                    (typeof record.diagnosis === "string"
                      ? record.diagnosis
                      : "Chưa có chẩn đoán")}
                </div>
              )}
              {record.symptoms?.chiefComplaint && (
                <div className="text-slate-700">
                  <span className="font-medium text-slate-900">
                    Triệu chứng:
                  </span>{" "}
                  {record.symptoms.chiefComplaint}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => handleViewDetail(record._id!)}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-white hover:bg-teal-700 focus:ring-2 focus:ring-offset-2 focus:ring-teal-400"
          >
            <Eye className="h-4 w-4" />
            Xem chi tiết
          </button>
        </div>
      </div>
    );
  };

  /* ------------------------------ Render ------------------------------ */

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 py-8">
        <div className="mx-auto max-w-6xl px-4 space-y-6">
          <Header />
          <SkeletonList />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 py-8">
        <div className="mx-auto max-w-6xl px-4 space-y-6">
          <Header />
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 py-8">
      <div className="mx-auto max-w-6xl px-4 space-y-6">
        <Header />

        {records.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {records.map((r) => (
              <Row key={r._id} record={r} />
            ))}
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {showDetail && (
        <DetailModal
          loading={detailLoading}
          record={selectedRecord}
          onClose={() => setShowDetail(false)}
          formatDate={formatDate}
        />
      )}
    </div>
  );
};

export default PatientMedicalRecords;

/* =======================================================================
   Detail Modal (Tabs + teal theme)
======================================================================= */

function DetailModal({
  loading,
  record,
  onClose,
  formatDate,
}: {
  loading: boolean;
  record: MedicalRecord | null;
  onClose: () => void;
  formatDate: (d?: string) => string;
}) {
  const [tab, setTab] = useState<
    "overview" | "vitals" | "symptoms" | "diagnosis" | "rx" | "followup"
  >("overview");

  if (!record) return null;

  const doc = record.doctor as unknown as PopulatedDoctor;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Chi tiết hồ sơ bệnh án</h3>
              <p className="text-white/90 text-sm">
                Mã: {record._id?.slice(-8)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-white/10 p-2 hover:bg-white/20"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200 px-4 pt-3">
          <Tab active={tab === "overview"} onClick={() => setTab("overview")}>
            Tổng quan
          </Tab>
          <Tab active={tab === "vitals"} onClick={() => setTab("vitals")}>
            Sinh hiệu
          </Tab>
          <Tab active={tab === "symptoms"} onClick={() => setTab("symptoms")}>
            Triệu chứng
          </Tab>
          <Tab active={tab === "diagnosis"} onClick={() => setTab("diagnosis")}>
            Chẩn đoán & Điều trị
          </Tab>
          <Tab active={tab === "rx"} onClick={() => setTab("rx")}>
            Đơn thuốc
          </Tab>
          <Tab active={tab === "followup"} onClick={() => setTab("followup")}>
            Theo dõi
          </Tab>
        </div>

        {/* Body */}
        <div className="max-h-[75vh] overflow-y-auto p-6">
          {loading ? (
            <div className="grid gap-4 animate-pulse">
              <div className="h-6 w-40 bg-slate-200 rounded" />
              <div className="h-4 w-3/4 bg-slate-100 rounded" />
              <div className="h-4 w-2/3 bg-slate-100 rounded" />
              <div className="h-4 w-1/2 bg-slate-100 rounded" />
            </div>
          ) : (
            <>
              {tab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card
                    title="Thông tin bác sĩ"
                    icon={<User className="h-4 w-4" />}
                    color="teal"
                  >
                    <InfoRow label="Họ tên" value={`BS. ${doc?.name || "—"}`} />
                    <InfoRow
                      label="Chuyên khoa"
                      value={doc?.specialty || "—"}
                    />
                    {doc?.workplace && (
                      <InfoRow label="Nơi làm việc" value={doc.workplace} />
                    )}
                  </Card>

                  <Card
                    title="Thông tin khám"
                    icon={<Clock className="h-4 w-4" />}
                    color="emerald"
                  >
                    <InfoRow
                      label="Ngày tạo"
                      value={formatDate(record.createdAt)}
                    />
                    {record.completedAt && (
                      <InfoRow
                        label="Hoàn thành"
                        value={formatDate(record.completedAt)}
                      />
                    )}
                    <InfoRow
                      label="Loại khám"
                      value={
                        record.consultationType === "online"
                          ? "Trực tuyến"
                          : "Tại phòng khám"
                      }
                    />
                  </Card>

                  {record.patientInfo && (
                    <Card
                      title="Thông tin bệnh nhân"
                      icon={<BookOpen className="h-4 w-4" />}
                      color="cyan"
                    >
                      <InfoRow
                        label="Họ tên"
                        value={record.patientInfo.fullName}
                      />
                      {record.patientInfo.birthYear && (
                        <InfoRow
                          label="Năm sinh"
                          value={String(record.patientInfo.birthYear)}
                        />
                      )}
                      {record.patientInfo.gender && (
                        <InfoRow
                          label="Giới tính"
                          value={
                            record.patientInfo.gender === "male"
                              ? "Nam"
                              : record.patientInfo.gender === "female"
                              ? "Nữ"
                              : "Khác"
                          }
                        />
                      )}
                      {record.patientInfo.insuranceNumber && (
                        <InfoRow
                          label="Bảo hiểm"
                          value={record.patientInfo.insuranceNumber}
                        />
                      )}
                    </Card>
                  )}
                </div>
              )}

              {tab === "vitals" && (record.quickScreening || record.vitals) && (
                <Card
                  title="Chỉ số sinh hiệu"
                  icon={<HeartPulse className="h-4 w-4" />}
                  color="orange"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <VitalBox
                      label="Nhiệt độ"
                      value={
                        record.quickScreening?.temperature ||
                        record.vitals?.temperature
                      }
                      unit="°C"
                    />
                    <VitalBox
                      label="Huyết áp"
                      value={
                        record.quickScreening?.bloodPressure ||
                        record.vitals?.bloodPressure
                      }
                    />
                    <VitalBox
                      label="Nhịp tim"
                      value={
                        record.quickScreening?.heartRate ||
                        record.vitals?.heartRate
                      }
                      unit="bpm"
                    />
                    <VitalBox
                      label="Cân nặng"
                      value={
                        record.quickScreening?.weight || record.vitals?.weight
                      }
                      unit="kg"
                    />
                  </div>
                </Card>
              )}

              {tab === "symptoms" && (
                <div className="grid gap-6">
                  {record.reasonForVisit && (
                    <AccentBlock title="Lý do khám" color="red">
                      {record.reasonForVisit}
                    </AccentBlock>
                  )}
                  {record.chiefComplaint && (
                    <AccentBlock title="Triệu chứng chính" color="yellow">
                      {record.chiefComplaint}
                    </AccentBlock>
                  )}
                  {record.symptomDetails && (
                    <Card
                      title="Chi tiết triệu chứng"
                      icon={<ClipboardList className="h-4 w-4" />}
                      color="amber"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {record.symptomDetails.location && (
                          <InfoRow
                            label="Vị trí"
                            value={record.symptomDetails.location}
                          />
                        )}
                        {record.symptomDetails.duration && (
                          <InfoRow
                            label="Thời gian"
                            value={record.symptomDetails.duration}
                          />
                        )}
                        {record.symptomDetails.severity !== undefined && (
                          <InfoRow
                            label="Mức độ"
                            value={`${record.symptomDetails.severity}/10`}
                          />
                        )}
                        {record.symptomDetails.character !== undefined && (
                          <InfoRow
                            label="Tính chất"
                            value={String(record.symptomDetails.character)}
                          />
                        )}
                        {record.symptomDetails.notes !== undefined && (
                          <div className="md:col-span-2">
                            <div className="text-sm font-medium text-slate-700">
                              Ghi chú
                            </div>
                            <p className="text-slate-700 mt-1">
                              {String(record.symptomDetails.notes)}
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {tab === "diagnosis" && (
                <div className="grid gap-6">
                  {record.generalExamination || record.clinicalExamination ? (
                    <Card
                      title="Khám lâm sàng"
                      icon={<Stethoscope className="h-4 w-4" />}
                      color="teal"
                    >
                      <div className="space-y-3 text-sm">
                        {record.generalExamination && (
                          <div>
                            <div className="text-sm font-medium text-slate-700">
                              Khám tổng quát
                            </div>
                            <div className="mt-1 text-slate-700">
                              {typeof record.generalExamination === "string" ? (
                                record.generalExamination
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {Object.entries(
                                    record.generalExamination
                                  ).map(([k, v]) => (
                                    <div
                                      key={k}
                                      className="rounded-lg bg-slate-50 px-3 py-2"
                                    >
                                      <span className="font-medium text-slate-800">
                                        {k}:
                                      </span>{" "}
                                      <span className="text-slate-700">
                                        {String(v)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {record.clinicalExamination?.generalAppearance && (
                          <InfoRow
                            label="Tình trạng chung"
                            value={record.clinicalExamination.generalAppearance}
                          />
                        )}
                        {record.clinicalExamination?.examinationNotes && (
                          <InfoRow
                            label="Ghi chú khám"
                            value={record.clinicalExamination.examinationNotes}
                          />
                        )}
                      </div>
                    </Card>
                  ) : null}

                  {record.preliminaryDiagnosis && (
                    <AccentBlock title="Chẩn đoán sơ bộ" color="rose">
                      {record.preliminaryDiagnosis}
                    </AccentBlock>
                  )}

                  {record.diagnosis || record.finalDiagnosis ? (
                    <Card
                      title="Chẩn đoán cuối cùng"
                      icon={<FileText className="h-4 w-4" />}
                      color="blue"
                    >
                      <div className="text-slate-800">
                        {record.finalDiagnosis ||
                          record.diagnosis?.primaryDiagnosis ||
                          (typeof record.diagnosis === "string"
                            ? record.diagnosis
                            : "Chưa có chẩn đoán")}
                      </div>
                      {record.diagnosis?.icdCode && (
                        <div className="mt-2 text-sm text-slate-600">
                          Mã ICD-10: {record.diagnosis.icdCode}
                        </div>
                      )}
                      {record.icdCodes && record.icdCodes.length > 0 && (
                        <div className="mt-1 text-sm text-slate-600">
                          Mã ICD-10: {record.icdCodes.join(", ")}
                        </div>
                      )}
                    </Card>
                  ) : null}

                  {record.treatment && (
                    <Card
                      title="Kế hoạch điều trị"
                      icon={<Pill className="h-4 w-4" />}
                      color="green"
                    >
                      <div className="text-slate-800">
                        {typeof record.treatment === "string" ? (
                          record.treatment
                        ) : record.treatment?.medicationsList ? (
                          <ul className="mt-2 list-disc pl-5 space-y-1">
                            {record.treatment.medicationsList.map(
                              (med, idx) => (
                                <li key={idx}>
                                  <span className="font-medium">
                                    {med.drugName}
                                  </span>{" "}
                                  – {med.strength}, {med.form}, {med.dosage},{" "}
                                  {med.frequency} lần/ngày, {med.duration} ngày,
                                  SL: {med.quantity}
                                  {med.instructions && (
                                    <span className="italic text-slate-700">
                                      {" "}
                                      ({med.instructions})
                                    </span>
                                  )}
                                </li>
                              )
                            )}
                          </ul>
                        ) : null}
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {tab === "rx" && record.prescription?.medications?.length ? (
                <Card
                  title={`Đơn thuốc (${record.prescription.medications.length} loại)`}
                  icon={<Pill className="h-4 w-4" />}
                  color="violet"
                >
                  <div className="space-y-3">
                    {record.prescription.medications.map((med, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-violet-200 bg-white p-3"
                      >
                        <div className="font-semibold text-violet-900">
                          {med.name}
                        </div>
                        <div className="mt-1 text-sm text-violet-700 space-y-1">
                          <div>
                            <span className="font-medium">Hàm lượng:</span>{" "}
                            {med.strength} •{" "}
                            <span className="font-medium">Dạng:</span>{" "}
                            {med.form}
                          </div>
                          <div>
                            <span className="font-medium">Liều lượng:</span>{" "}
                            {med.dosage} •{" "}
                            <span className="font-medium">Tần suất:</span>{" "}
                            {med.frequency}
                          </div>
                          <div>
                            <span className="font-medium">Thời gian:</span>{" "}
                            {med.duration} ngày •{" "}
                            <span className="font-medium">Số lượng:</span>{" "}
                            {med.quantity}
                          </div>
                          {med.instructions && (
                            <div className="italic text-violet-700">
                              <span className="font-medium">Hướng dẫn:</span>{" "}
                              {med.instructions}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {record.prescription.notes && (
                    <div className="mt-3 rounded-lg bg-violet-50 p-3 text-violet-800">
                      <span className="font-medium">Ghi chú:</span>{" "}
                      {String(record.prescription.notes)}
                    </div>
                  )}
                </Card>
              ) : tab === "rx" ? (
                <Muted>Không có đơn thuốc.</Muted>
              ) : null}

              {tab === "followup" && record.followUpCare ? (
                <Card
                  title="Hướng dẫn theo dõi"
                  icon={<ClipboardList className="h-4 w-4" />}
                  color="emerald"
                >
                  <div className="space-y-3 text-sm">
                    {record.followUpCare.instructions && (
                      <InfoRow
                        label="Chăm sóc"
                        value={record.followUpCare.instructions}
                      />
                    )}
                    {record.followUpCare.warningSignsEducation && (
                      <InfoRow
                        label="Dấu hiệu cảnh báo"
                        value={record.followUpCare.warningSignsEducation}
                      />
                    )}
                    {record.followUpCare.nextAppointment?.date && (
                      <InfoRow
                        label="Lịch tái khám"
                        value={record.followUpCare.nextAppointment.date}
                      />
                    )}
                  </div>
                </Card>
              ) : tab === "followup" ? (
                <Muted>Chưa có hướng dẫn theo dõi.</Muted>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Small atoms ---------------------------- */

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative rounded-t-xl px-3 py-2 text-sm font-semibold transition
      ${active ? "text-teal-700" : "text-slate-500 hover:text-slate-700"}`}
    >
      {children}
      {active && (
        <span className="absolute inset-x-2 -bottom-[1px] h-0.5 rounded bg-gradient-to-r from-teal-500 to-emerald-500" />
      )}
    </button>
  );
}

function Card({
  title,
  icon,
  color,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  color?:
    | "teal"
    | "emerald"
    | "cyan"
    | "orange"
    | "amber"
    | "green"
    | "blue"
    | "violet";
  children: React.ReactNode;
}) {
  const ring = {
    teal: "ring-teal-200",
    emerald: "ring-emerald-200",
    cyan: "ring-cyan-200",
    orange: "ring-orange-200",
    amber: "ring-amber-200",
    green: "ring-green-200",
    blue: "ring-blue-200",
    violet: "ring-violet-200",
  }[color || "teal"];

  const dot = {
    teal: "from-teal-500 to-emerald-500",
    emerald: "from-emerald-500 to-green-500",
    cyan: "from-cyan-500 to-teal-500",
    orange: "from-orange-500 to-amber-500",
    amber: "from-amber-500 to-yellow-500",
    green: "from-green-500 to-emerald-500",
    blue: "from-blue-500 to-cyan-500",
    violet: "from-violet-500 to-fuchsia-500",
  }[color || "teal"];

  return (
    <div className={`rounded-2xl border bg-white p-5 shadow ring-1 ${ring}`}>
      <div className="mb-3 flex items-center gap-2">
        <div
          className={`h-8 w-8 rounded-xl bg-gradient-to-br ${dot} text-white grid place-items-center`}
        >
          {icon}
        </div>
        <h4 className="text-base font-semibold text-slate-900">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="text-sm">
      <span className="font-medium text-slate-700">{label}:</span>{" "}
      <span className="text-slate-800">{value || "—"}</span>
    </div>
  );
}

function VitalBox({
  label,
  value,
  unit,
}: {
  label: string;
  value?: string | number;
  unit?: string;
}) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="rounded-xl bg-white px-4 py-3 text-center ring-1 ring-orange-200">
      <div className="text-xs font-semibold uppercase tracking-wide text-orange-700">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-slate-900">
        {value}
        {unit ? ` ${unit}` : ""}
      </div>
    </div>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-600">
      {children}
    </div>
  );
}

function AccentBlock({
  title,
  color,
  children,
}: {
  title: string;
  color: "red" | "yellow" | "rose";
  children: React.ReactNode;
}) {
  const map = {
    red: { wrap: "from-red-50 to-red-100", text: "text-red-900" },
    yellow: { wrap: "from-yellow-50 to-yellow-100", text: "text-yellow-900" },
    rose: { wrap: "from-rose-50 to-rose-100", text: "text-rose-900" },
  }[color];
  return (
    <div className={`rounded-xl bg-gradient-to-br ${map.wrap} p-4`}>
      <h4 className={`mb-2 font-semibold ${map.text}`}>{title}</h4>
      <div className="text-slate-800">{children}</div>
    </div>
  );
}
