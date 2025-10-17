import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { CheckCircle } from "lucide-react";

type ConfirmResponse = {
  success: boolean;
  message?: string;
  appointment?: { _id: string };
};

// Small Success animation component (local) with fallback
const SuccessAnimation: React.FC = () => {
  const [hasError, setHasError] = useState(false);
  // isLoading: true until the large/main animation finished loading
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    console.error("DotLottie animation failed to load");
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (hasError) {
    return (
      <div className="w-24 h-24 flex items-center justify-center">
        <CheckCircle size={56} className="text-green-500" />
      </div>
    );
  }

  // Render a small centered preloader while the main animation is loading.
  // Once the main animation `onLoad` fires we hide the preloader and show the main animation.
  return (
    <div className="w-32 h-32 relative">
      {/* Preloader - small centered animation */}
      {isLoading && (
        <div className="w-full h-full flex items-center justify-center">
          <DotLottieReact
            src="https://lottie.host/2e58ad14-075d-41ea-b02d-ff07eaf8c361/4wtHlM8olI.lottie"
            loop
            autoplay
          />
        </div>
      )}

      {/* Main animation - hidden until loaded */}
      <div
        className="w-full h-full"
        style={{ display: isLoading ? "none" : "block" }}
      >
        <DotLottieReact
          src="https://lottie.host/69533610-ec9e-4652-a9e0-eec5b360f37b/YNNU0BrBD8.lottie"
          loop
          autoplay
          onError={handleError}
          onLoad={handleLoad}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
};

const VNPayReturn: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");
  const [appointmentIdFromServer, setAppointmentIdFromServer] = useState<
    string | null
  >(null);
  // no local paymentData needed; server confirms and we show success UI

  useEffect(() => {
    const processReturn = async () => {
      try {
        // Use raw query to preserve '+' characters
        const raw = window.location.search.substring(1);

        // Use explicit dev backend host if running in dev (ensures correct port),
        // otherwise use relative path for production deployments.
        const isDev = import.meta.env.MODE === "development";
        const devHost = "http://localhost:5000";
        // NOTE: server mounts payment routes under /api/patient/payments
        const apiPath = isDev
          ? `${devHost}/api/patient/payments/vnpay/confirm`
          : `/api/patient/payments/vnpay/confirm`;

        const resp = await fetch(apiPath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rawQuery: raw }),
        });

        // parse JSON safely (handle 404/html responses)
        let data: ConfirmResponse | null = null;
        try {
          data = await resp.json();
        } catch (err: unknown) {
          const text = await resp.text();
          console.error("Non-JSON response from confirm endpoint:", text, err);
          throw new Error(text || "Unexpected response from server");
        }
        if (resp.ok && data && data.success) {
          setStatus("success");
          setMessage("Thanh toán thành công!");
          if (data && data.appointment && data.appointment._id) {
            setAppointmentIdFromServer(data.appointment._id);
          }
          // NOTE: do NOT auto-redirect; show success animation and let user click through
        } else {
          setStatus("error");
          setMessage((data && data.message) || "Thanh toán không thành công.");
        }
      } catch {
        // Log to Sentry or remote logging in future (avoid console noise in production)
        setStatus("error");
        setMessage("Có lỗi xảy ra khi xác thực thanh toán.");
      }
    };

    processReturn();
  }, [navigate]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang xử lý kết quả thanh toán...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          {status === "success" ? (
            <>
              <div className="flex justify-center mb-4">
                <SuccessAnimation />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Thanh toán thành công!
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <div className="mt-4 flex gap-3 justify-center">
                <button
                  onClick={() => {
                    if (appointmentIdFromServer) {
                      // Replace current URL instead of pushing to prevent back navigation
                      navigate(
                        `/appointments/${appointmentIdFromServer}/slip`,
                        { replace: true }
                      );
                    } else {
                      navigate("/appointments", { replace: true });
                    }
                  }}
                  className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
                >
                  Xem phiếu khám
                </button>
                <button
                  onClick={() => navigate("/", { replace: true })}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Về trang chủ
                </button>
              </div>
            </>
          ) : (
            <>
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Thanh toán không thành công
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <button
                onClick={() => navigate(-1)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg"
              >
                Quay lại
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VNPayReturn;
