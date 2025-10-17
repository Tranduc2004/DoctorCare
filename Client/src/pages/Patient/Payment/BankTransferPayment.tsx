import React, { useState } from "react";
import api from "../../../api/axiosConfig";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useParams } from "react-router-dom";

type Account = {
  id?: string;
  name?: string;
  bankName?: string;
  accountNumber?: string;
  branch?: string;
  note?: string;
};

type Props = {
  invoiceId: string;
};

const BankTransferPayment: React.FC<Props> = ({ invoiceId }) => {
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [payload, setPayload] = useState<string | null>(null);
  const [payosCheckout, setPayosCheckout] = useState<{
    checkoutUrl?: string;
    qrImage?: string;
    qrCode?: string;
    orderCode?: string;
  } | null>(null);
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const isPayosCheckout = (
    obj: unknown
  ): obj is { checkoutUrl?: string; qrImage?: string; qrCode?: string } => {
    if (!obj || typeof obj !== "object") return false;
    const r = obj as Record<string, unknown>;
    return (
      typeof r["checkoutUrl"] === "string" ||
      typeof r["qrImage"] === "string" ||
      typeof r["qrCode"] === "string"
    );
  };

  type PayosNormalized = {
    checkoutUrl?: string;
    qrImage?: string;
    qrCode?: string;
    orderCode?: string;
  } | null;

  const fetchQr = async () => {
    try {
      setLoading(true);

      // Đầu tiên lấy thông tin invoice để có amount và account
      try {
        const invoiceResp = await api.get(
          `/patient/payments/status/invoice/${invoiceId}`
        );
        console.log("Invoice details:", invoiceResp.data);

        if (invoiceResp.data && invoiceResp.data.invoice) {
          const invoice = invoiceResp.data.invoice;
          // Set amount
          setAmount(invoice.patientAmount || invoice.amount || null);

          // Set account info từ invoice.paymentDetails
          if (invoice.paymentDetails && invoice.paymentDetails.bankAccount) {
            const bankAcc = invoice.paymentDetails.bankAccount;
            setAccount({
              id: bankAcc.id,
              name: bankAcc.accountName || "--",
              bankName: bankAcc.bankName || "--",
              accountNumber: bankAcc.accountNumber || "--",
              branch: bankAcc.branch || "",
              note: invoice.paymentDetails.note || "",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching invoice details:", error);
      }

      // Sau đó tạo PayOS payment
      let resp;
      try {
        resp = await api.post("/patient/payments/payos/create", {
          invoiceId,
        });
      } catch (error) {
        console.error("Error:", error);
        // If PayOS endpoint isn't available on the server, try legacy route
        resp = await api.post("/patient/payments/bank-transfer/qr", {
          invoiceId,
        });
      }

      // Then get QR code
      const data = resp.data;
      console.log("PayOS response:", data);

      const payosCheckoutObj = data["payosCheckout"] as
        | Record<string, unknown>
        | undefined;
      const orderCandidate =
        (data["orderCode"] as string | undefined) ||
        (payosCheckoutObj && (payosCheckoutObj["orderCode"] as string)) ||
        (data["paymentLinkId"] as string | undefined) ||
        (payosCheckoutObj && (payosCheckoutObj["paymentLinkId"] as string)) ||
        null;

      const pollTarget = invoiceId || (orderCandidate as string) || null;

      if (pollTarget) {
        (async function poll(id: string) {
          const start = Date.now();
          const timeoutMs = 1000 * 60 * 5; // 5 minutes
          const intervalMs = 3000; // 3s
          while (Date.now() - start < timeoutMs) {
            try {
              const statusResp = await api.get(
                `/patient/payments/status/invoice/${id}`
              );
              const payment = statusResp.data.payment;
              if (
                payment &&
                payment.status &&
                (String(payment.status).toLowerCase() === "captured" ||
                  String(payment.status).toLowerCase() === "paid")
              ) {
                // Show success modal instead of reloading
                setShowSuccessModal(true);
                return;
              }
            } catch (_err) {
              void _err;
            }
            await new Promise((r) => setTimeout(r, intervalMs));
          }
        })(pollTarget as string);
      }
      setPayload(data.payload || null);

      setPayload(data.payload || null);

      const raw = (resp && resp.data) || resp || {};
      const candidate =
        raw.qrCode ||
        raw.qr_code ||
        raw.checkoutUrl ||
        raw.checkout_url ||
        (raw.payosCheckout &&
          (raw.payosCheckout.qrCode ||
            raw.payosCheckout.qr_code ||
            raw.payosCheckout.qrImage ||
            raw.payosCheckout.checkoutUrl)) ||
        (raw.data &&
          (raw.data.qrCode ||
            raw.data.qr_code ||
            raw.data.checkoutUrl ||
            raw.data.qrImage)) ||
        null;

      const ensureDataUrl = (s: unknown) => {
        if (!s || typeof s !== "string") return null;
        const v = s.trim();
        if (v.startsWith("data:")) return v;
        if (/^https?:\/\//i.test(v)) return v;
        const candidate = v.replace(/\s+/g, "");
        if (/^[A-Za-z0-9+/=]+$/.test(candidate) && candidate.length > 100) {
          return `data:image/png;base64,${candidate}`;
        }
        return null;
      };

      // Special-case: some servers return the EMV payload (starts with 000201)
      // either directly, or wrapped inside `data:image/png;base64,` incorrectly.
      // Detect that and generate a proper PNG data URL from the EMV text so the
      // <img> can render it. Otherwise, fall back to existing normalization.
      const tryGenerateFromEmv = async (s: string) => {
        // strip data: prefix if present
        const withoutPrefix = s.replace(/^data:[^,]+,/, "");
        const trimmed = withoutPrefix.trim();
        if (/^000201/.test(trimmed)) {
          try {
            const qrcodeLib = await import("qrcode");
            return await qrcodeLib.toDataURL(trimmed, { margin: 1 });
          } catch (_e) {
            void _e;
            return null;
          }
        }
        return null;
      };

      const normalizedQr = ensureDataUrl(candidate);
      if (normalizedQr) {
        // If normalizedQr is a data: URI that still contains an EMV payload (bad server),
        // try to detect and regenerate correctly.
        const regenerated = await tryGenerateFromEmv(normalizedQr);
        setQrSrc(regenerated || normalizedQr);
      } else if (candidate && typeof candidate === "string") {
        // Candidate is a string but didn't match the base64/URL heuristics.
        // If it looks like EMV, generate an image; otherwise use as-is.
        const generated = await tryGenerateFromEmv(candidate);
        if (generated) setQrSrc(generated);
        else setQrSrc(candidate);
      } else {
        setQrSrc(null);
      }

      // Normalize PayOS checkout payload which may be in different shapes
      const rawPayos = data.payosCheckout || data || null;
      let normalizedPayos: PayosNormalized = null;
      if (rawPayos) {
        // payos SDK may return { code, desc, data: { ... } } or the data directly
        const maybeData = rawPayos.data || rawPayos;
        // Helper: normalize possible fields
        const pick = (keys: string[]) => {
          for (const k of keys) {
            if (maybeData[k]) return maybeData[k];
          }
          return undefined;
        };

        let rawQrImage = pick([
          "qrImage",
          "qr_image",
          "qrImg",
          "qr",
          "qrCode",
          "qr_code",
        ]);

        // If PayOS returned a raw base64 string without data: prefix, add it
        if (
          rawQrImage &&
          typeof rawQrImage === "string" &&
          !rawQrImage.startsWith("data:") &&
          !/^https?:\/\//i.test(rawQrImage)
        ) {
          // Basic heuristic: long base64 string (only base64 chars and padding)
          const base64Candidate = rawQrImage.replace(/\s+/g, "");
          if (
            /^[A-Za-z0-9+/=]+$/.test(base64Candidate) &&
            base64Candidate.length > 100
          ) {
            rawQrImage = `data:image/png;base64,${base64Candidate}`;
          }
        }

        const ensureDataUrl = (v: unknown) => {
          if (!v || typeof v !== "string") return undefined;
          const s = v.trim();
          if (s.startsWith("data:")) return s;
          if (/^https?:\/\//i.test(s)) return s;
          const candidate = s.replace(/\s+/g, "");
          if (/^[A-Za-z0-9+/=]+$/.test(candidate) && candidate.length > 100) {
            return `data:image/png;base64,${candidate}`;
          }
          return undefined;
        };

        const maybeQrImage = ensureDataUrl(rawQrImage) || undefined;
        const maybeQrCode = ensureDataUrl(
          pick(["qrCode", "qr_code", "qr", "qrImage", "qr_image"]) || undefined
        );

        normalizedPayos = {
          checkoutUrl:
            pick(["checkoutUrl", "checkout_url", "url", "paymentUrl"]) ||
            undefined,
          qrImage: maybeQrImage,
          qrCode: maybeQrCode,
          orderCode: pick(["orderCode", "order_code"]) || undefined,
        };
      }

      if (normalizedPayos) {
        // when PayOS checkout is present, prefer it. Ensure qrCode is surfaced exactly
        // as returned by PayOS SDK when possible (resp.qrCode).
        // If API returned nested data, the normalization above already picked it.
        setPayosCheckout(normalizedPayos);
      } else {
        setPayosCheckout(null);
        // No static QR fallback allowed for PayOS-enabled flows; surface an error
        alert(
          "Không tìm thấy thông tin thanh toán PayOS. Vui lòng thử lại hoặc liên hệ hỗ trợ."
        );
      }
    } catch {
      // show friendly message; avoid logging to console in production
      alert("Không thể tạo mã QR. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md text-center">
            <div className="flex justify-center mb-4">
              <div className="w-48 h-48">
                <DotLottieReact
                  src="https://lottie.host/69533610-ec9e-4652-a9e0-eec5b360f37b/YNNU0BrBD8.lottie"
                  loop
                  autoplay
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-green-700">
              Thanh toán thành công
            </h2>
            <p className="mt-2 text-gray-600">
              Cảm ơn bạn đã hoàn tất thanh toán.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() =>
                  (window.location.href = `/appointments/${appointmentId}/slip`)
                }
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
              >
                Xem phiếu khám
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Original content */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm text-gray-600">Thanh toán chuyển khoản</div>
          <div className="text-sm text-gray-500">Quét mã QR để chuyển tiền</div>
        </div>
        <div>
          <button
            onClick={fetchQr}
            disabled={loading}
            className="px-3 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? "Đang tạo..." : "Tạo mã QR"}
          </button>
        </div>
      </div>

      {payosCheckout && (
        <div className="text-center">
          {/* Debug: show raw response so user can copy it for troubleshooting */}

          {/* Prefer PayOS checkout QR / checkoutUrl when available */}
          {qrSrc ? (
            <a href={qrSrc} target="_blank" rel="noreferrer">
              <img
                src={qrSrc}
                alt="QR thanh toán PayOS"
                className="mx-auto mb-3 w-80 h-80"
              />
            </a>
          ) : isPayosCheckout(payosCheckout) && payosCheckout.checkoutUrl ? (
            <div className="mb-3">
              <a
                href={payosCheckout.checkoutUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block px-4 py-2 bg-teal-600 text-white rounded-md"
              >
                Mở trang thanh toán
              </a>
            </div>
          ) : (
            <div className="text-red-600">Không có thông tin thanh toán.</div>
          )}
          <div className="mb-2 font-medium text-red-500">
            Số tiền:{" "}
            {amount && !isNaN(amount)
              ? new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(amount)
              : "--"}
          </div>
          {account && (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 max-w-md mx-auto text-sm">
              <h3 className="text-base font-medium mb-3 text-gray-800 border-b pb-2">
                Thông tin chuyển khoản
              </h3>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Người thụ hưởng:</span>
                  <span className="font-medium text-gray-900">
                    {account.name || "--"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Ngân hàng:</span>
                  <span className="font-medium text-gray-900">
                    {account.bankName || "--"}
                  </span>
                </div>
                <div className="flex justify-between items-center group">
                  <span className="text-gray-600">Số tài khoản:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {account.accountNumber || "--"}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          account?.accountNumber || ""
                        );
                        alert("Đã sao chép số tài khoản");
                      }}
                      className="text-teal-600 hover:text-teal-700 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      </svg>
                    </button>
                  </div>
                </div>
                {account.branch && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Chi nhánh:</span>
                    <span className="font-medium text-gray-900">
                      {account.branch}
                    </span>
                  </div>
                )}
                {account.note && (
                  <div className="mt-3 pt-2 border-t">
                    <div className="text-gray-600 mb-1">
                      Nội dung chuyển khoản:
                    </div>
                    <div className="font-medium text-gray-900 bg-gray-50 p-2 rounded-md break-all">
                      {account.note}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(account.note || "");
                          alert("Đã sao chép nội dung chuyển khoản");
                        }}
                        className="ml-2 text-teal-600 hover:text-teal-700 transition-colors inline-flex items-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-3">
                  * Vui lòng ghi đúng nội dung chuyển khoản để được xác nhận tự
                  động
                </div>
              </div>
            </div>
          )}
          <div className="mt-3 flex gap-2 justify-center">
            {(() => {
              const checkoutSrc =
                qrSrc ||
                (isPayosCheckout(payosCheckout)
                  ? payosCheckout.qrImage ||
                    payosCheckout.qrCode ||
                    payosCheckout.checkoutUrl
                  : undefined);
              return (
                <a
                  download={`qr-${invoiceId}.png`}
                  href={checkoutSrc || "#"}
                  target={checkoutSrc ? "_blank" : undefined}
                  rel={checkoutSrc ? "noreferrer" : undefined}
                  className="px-3 py-2 bg-gray-100 rounded-md"
                >
                  Tải QR
                </a>
              );
            })()}
            <button
              onClick={() =>
                navigator.clipboard.writeText(account?.accountNumber || "")
              }
              className="px-3 py-2 bg-gray-100 rounded-md"
            >
              Sao chép tài khoản
            </button>
            {payload && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(payload || "");
                  alert("Đã sao chép payload QR (debug)");
                }}
                className="px-3 py-2 bg-gray-100 rounded-md"
              >
                Sao chép payload
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BankTransferPayment;
