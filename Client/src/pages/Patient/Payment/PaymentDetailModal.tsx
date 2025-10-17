import React, { useEffect, useState } from "react";
import { paymentApi } from "../../../api/paymentApi";
import { Download, X } from "lucide-react";
import Tooltip from "@mui/material/Tooltip";

type Props = {
  appointmentId: string | null;
  paymentId?: string | null;
  open: boolean;
  onClose: () => void;
  onPaid?: () => void;
};

type Invoice = {
  _id: string;
  type?: string;
  patientAmount?: number;
  status?: string;
};

type PaymentRecord = {
  _id: string;
  description?: string;
  amount?: number;
  status?: string;
};

type DetailsResponse = {
  appointment?: { doctorId?: { name?: string }; status?: string } | null;
  invoices?: Invoice[];
  payments?: PaymentRecord[];
};

const getStatusInfo = (status?: string) => {
  switch (status?.toLowerCase()) {
    case "pending":
      return {
        text: "Chờ thanh toán",
        style: "bg-amber-100 text-amber-700",
        ring: "ring-amber-200",
        dot: "bg-amber-500",
      };
    case "paid":
      return {
        text: "Đã thanh toán",
        style: "bg-emerald-100 text-emerald-700",
        ring: "ring-emerald-200",
        dot: "bg-emerald-500",
      };
    case "completed":
    case "hoàn thành":
      return {
        text: "Hoàn thành",
        style: "bg-teal-100 text-teal-700",
        ring: "ring-teal-200",
        dot: "bg-teal-500",
      };
    case "failed":
    case "thất bại":
    case "canceled":
    case "đã hủy":
      return {
        text: "Thất bại/Đã hủy",
        style: "bg-rose-100 text-rose-700",
        ring: "ring-rose-200",
        dot: "bg-rose-500",
      };
    case "success":
    case "thành công":
      return {
        text: "Thành công",
        style: "bg-emerald-100 text-emerald-700",
        ring: "ring-emerald-200",
        dot: "bg-emerald-500",
      };
    default:
      return {
        text: status || "Không xác định",
        style: "bg-slate-100 text-slate-700",
        ring: "ring-slate-200",
        dot: "bg-slate-400",
      };
  }
};

const PaymentDetailModal: React.FC<Props> = ({
  appointmentId,
  paymentId,
  open,
  onClose,
  onPaid,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DetailsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!open || !appointmentId) return;
    setLoading(true);
    setError(null);
    paymentApi
      .getDetails(appointmentId)
      .then((d) => setData(d as DetailsResponse))
      .catch((e: unknown) => {
        type AxLike = { response?: { data?: { message?: unknown } } };
        let msg = "Không tải được dữ liệu";
        if (e && typeof e === "object") {
          const ax = e as AxLike;
          if (ax.response?.data?.message !== undefined)
            msg = String(ax.response.data.message);
          else if (e instanceof Error && e.message) msg = e.message;
        } else if (e instanceof Error && e.message) msg = e.message;
        setError(String(msg));
      })
      .finally(() => setLoading(false));
  }, [open, appointmentId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop dịu hơn */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      {/* container: nền trắng, viền + bóng nhẹ */}
      <div className="relative z-10 w-full max-w-3xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        {/* header: bar mảnh có điểm nhấn teal nhưng không quá chói */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-teal-500/10 rounded-2xl">
          <div className="flex items-center gap-3 ">
            <span className="inline-block h-2 w-2 rounded-full bg-teal-500" />
            <h3 className="text-lg font-semibold text-slate-900">
              Chi tiết thanh toán
            </h3>
          </div>
          <Tooltip title="Đóng">
            <button
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-6 w-6" />
            </button>
          </Tooltip>
        </div>

        <div className="px-6 py-5">
          {loading && (
            <div className="py-10 text-center">
              <div className="mx-auto mb-2 h-10 w-10 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
              <div className="text-slate-600">Đang tải thông tin…</div>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
              {error}
            </div>
          )}

          {!loading && !error && data && (
            <div className="space-y-6">
              {/* Thông tin lịch hẹn */}
              <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">
                  Thông tin lịch hẹn
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                    <div className="text-xs text-slate-500">
                      Bác sĩ phụ trách
                    </div>
                    <div className="mt-0.5 font-medium text-slate-900">
                      {data.appointment?.doctorId?.name || "-"}
                    </div>
                  </div>
                  <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                    <div className="text-xs text-slate-500">Trạng thái</div>
                    <div className="mt-0.5 font-medium text-slate-900">
                      {getStatusInfo(data.appointment?.status).text}
                    </div>
                  </div>
                </div>
              </section>

              {/* Hóa đơn */}
              <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">
                  Chi tiết hóa đơn
                </h4>

                {(!data.invoices || data.invoices.length === 0) && (
                  <div className="rounded-lg bg-white p-3 text-center text-sm text-slate-500 ring-1 ring-slate-200">
                    Không tìm thấy hóa đơn
                  </div>
                )}

                <div className="space-y-3">
                  {data.invoices?.map((inv) => (
                    <div
                      key={inv._id}
                      className="rounded-xl bg-white p-4 ring-1 ring-slate-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-slate-900 font-medium">
                            {inv.type || "Hóa đơn"}
                          </div>
                          <div className="font-mono text-xs text-slate-500">
                            {inv._id}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-slate-900">
                            {inv.patientAmount
                              ? inv.patientAmount.toLocaleString() + "đ"
                              : "-"}
                          </div>
                          <span
                            className={[
                              "mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                              getStatusInfo(inv.status).style,
                            ].join(" ")}
                          >
                            {getStatusInfo(inv.status).text}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        {inv.status === "pending" ? (
                          <button
                            onClick={async () => {
                              try {
                                setProcessing(true);
                                await paymentApi.processPayment(
                                  inv._id,
                                  "card",
                                  appointmentId || undefined
                                );
                                onPaid?.();
                              } catch {
                                alert("Thanh toán thất bại");
                              } finally {
                                setProcessing(false);
                              }
                            }}
                            disabled={processing}
                            className="inline-flex w-full items-center justify-center rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-teal-700 hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {processing ? "Đang xử lý…" : "Thanh toán"}
                          </button>
                        ) : (
                          <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50">
                            <Download className="h-4 w-4" />
                            Tải biên lai thanh toán
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Lịch sử thanh toán (nếu truyền paymentId) */}
              {paymentId && (
                <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">
                    Lịch sử thanh toán
                  </h4>
                  {data.payments
                    ?.filter((p) => p._id === paymentId)
                    .map((p) => (
                      <div
                        key={p._id}
                        className="rounded-xl bg-white p-4 ring-1 ring-slate-200"
                      >
                        <div className="mb-1 flex items-start justify-between">
                          <div className="font-medium text-slate-900">
                            {p.description}
                          </div>
                          <div className="text-lg font-semibold text-slate-900">
                            {p.amount ? p.amount.toLocaleString() + "đ" : "-"}
                          </div>
                        </div>
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            getStatusInfo(p.status).style,
                          ].join(" ")}
                        >
                          {getStatusInfo(p.status).text}
                        </span>
                      </div>
                    ))}
                </section>
              )}
            </div>
          )}

          {/* footer */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailModal;
