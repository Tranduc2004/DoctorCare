import React from "react";

type State = {
  hasError: boolean;
  error?: Error | null;
  info?: React.ErrorInfo | null;
};

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log ra console/sentry
    console.error("ErrorBoundary:", error, info);
    this.setState({ error, info });
  }

  handleReload = () => {
    // Nếu muốn “thử lại” không reload page, bạn có thể setState({ hasError: false })
    // nhưng đa phần nên reload để clean state global.
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gradient-to-b from-white to-slate-50 px-4">
        <div className="w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 bg-white overflow-hidden">
          {/* Header gradient đồng bộ màu */}
          <div className="bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-600 text-white p-6">
            <h2 className="text-xl font-semibold">Đã có lỗi xảy ra</h2>
            <p className="opacity-90 mt-1">
              Rất tiếc vì sự cố. Hãy thử tải lại trang để tiếp tục sử dụng.
            </p>
          </div>

          <div className="p-6">
            {/* Hàng nút hành động */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Nút chính: Tải lại trang (gradient) */}
              <button
                onClick={this.handleReload}
                className="group inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 
                           text-white font-medium shadow-lg
                           bg-gradient-to-r from-teal-500 to-blue-600
                           hover:from-teal-600 hover:to-blue-700 
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-400"
              >
                {/* Icon reload (SVG) */}
                <svg
                  className="w-5 h-5 transition-transform group-hover:rotate-180"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                  <polyline points="21 3 21 9 15 9" />
                </svg>
                Tải lại trang
              </button>

              {/* Nút phụ: về trang chủ */}
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-xl px-5 py-3 
                           border border-teal-500 text-teal-600 font-medium
                           hover:bg-teal-50 focus:outline-none focus:ring-2 
                           focus:ring-offset-2 focus:ring-teal-400"
              >
                Về trang chủ
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
