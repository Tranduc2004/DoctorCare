import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AuthContainer from "./components/Auth/AuthContainer";
import Home from "./pages/Patient/Home/Home";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import "./App.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AppointmentPage from "./pages/Patient/Appointment/Appointment";

//Doctor
import LoginDoctor from "./pages/Doctor/Login/Login";
import RegisterDoctor from "./pages/Doctor/Register/Register";
import DoctorDashboard from "./pages/Doctor/Home/Home";
import DoctorSchedulePage from "./pages/Doctor/Schedule/Schedule";
import DoctorAppointmentsPage from "./pages/Doctor/Appointments/Appointments";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import DoctorLayout from "./components/layout/DoctorLayout";

//Patient

function PrivateRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactElement;
  allowedRoles: string[];
}) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Kiểm tra portal cuối cùng từ sessionStorage nếu user đã logout
    let loginPath = "/login"; // default to patient login

    if (user?.role) {
      // Nếu user còn tồn tại, sử dụng role của user
      loginPath = user.role === "doctor" ? "/doctor/login" : "/login";
    } else {
      // Nếu user đã logout, kiểm tra portal cuối cùng
      const lastPortal = window.sessionStorage.getItem("lastPortal");
      if (lastPortal === "doctor") {
        loginPath = "/doctor/login";
      }
      // Xóa thông tin portal sau khi sử dụng
      window.sessionStorage.removeItem("lastPortal");
    }

    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // Kiểm tra role và chuyển hướng nếu không có quyền truy cập
  if (!allowedRoles.includes(user?.role || "")) {
    // Chuyển hướng đến trang dashboard tương ứng với role
    if (user?.role === "doctor") {
      return <Navigate to="/doctor" replace />;
    } else if (user?.role === "patient") {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

function AppContent() {
  const location = useLocation();
  const isPatientPage =
    location.pathname === "/" || location.pathname === "/appointment";

  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/doctor/login" ||
    location.pathname === "/doctor/register";

  return (
    <div className="App">
      <ToastContainer position="top-right" autoClose={2500} />
      {isPatientPage && !isAuthPage && <Header />}
      <Routes>
        {/* Doctor Routes */}
        <Route path="/doctor/login" element={<LoginDoctor />} />
        <Route path="/doctor/register" element={<RegisterDoctor />} />
        <Route element={<ProtectedRoute />}>
          <Route
            path="/doctor"
            element={
              <PrivateRoute allowedRoles={["doctor"]}>
                <DoctorLayout>
                  <DoctorDashboard />
                </DoctorLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/doctor/home"
            element={
              <PrivateRoute allowedRoles={["doctor"]}>
                <DoctorLayout>
                  <DoctorDashboard />
                </DoctorLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/doctor/schedule"
            element={
              <PrivateRoute allowedRoles={["doctor"]}>
                <DoctorLayout>
                  <DoctorSchedulePage />
                </DoctorLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/doctor/patients"
            element={
              <PrivateRoute allowedRoles={["doctor"]}>
                <DoctorLayout>
                  <div className="p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">
                      Quản lý bệnh nhân
                    </h1>
                    <p className="text-gray-600">
                      Trang quản lý bệnh nhân đang được phát triển...
                    </p>
                  </div>
                </DoctorLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/doctor/medical-records"
            element={
              <PrivateRoute allowedRoles={["doctor"]}>
                <DoctorLayout>
                  <div className="p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">
                      Hồ sơ bệnh án
                    </h1>
                    <p className="text-gray-600">
                      Trang hồ sơ bệnh án đang được phát triển...
                    </p>
                  </div>
                </DoctorLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/doctor/appointments"
            element={
              <PrivateRoute allowedRoles={["doctor"]}>
                <DoctorLayout>
                  <DoctorAppointmentsPage />
                </DoctorLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/doctor/settings"
            element={
              <PrivateRoute allowedRoles={["doctor"]}>
                <DoctorLayout>
                  <div className="p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">
                      Cài đặt
                    </h1>
                    <p className="text-gray-600">
                      Trang cài đặt đang được phát triển...
                    </p>
                  </div>
                </DoctorLayout>
              </PrivateRoute>
            }
          />
        </Route>

        {/* Patient Routes */}
        <Route path="/login" element={<AuthContainer />} />
        <Route
          path="/appointment"
          element={
            <PrivateRoute allowedRoles={["patient"]}>
              <AppointmentPage />
            </PrivateRoute>
          }
        />

        {/* Public Routes */}
        <Route path="/" element={<Home />} />
      </Routes>
      {isPatientPage && !isAuthPage && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
