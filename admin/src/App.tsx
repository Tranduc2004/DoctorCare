import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import { useAdminAuth } from "./hooks/useAdminAuth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/patients/Patients";
import Doctors from "./pages/doctors/Doctors";
import AdminLayout from "./components/layout/AdminLayout";
import UserDetail from "./pages/users/UserDetail";
import DoctorSchedule from "./pages/schedules/DoctorSchedule";
import "./App.css";

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, initialized } = useAdminAuth();

  if (!initialized) {
    return null; // hoặc spinner nhẹ nếu muốn
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirect if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, initialized } = useAdminAuth();

  if (!initialized) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AdminAuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Dashboard />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Patients />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctors"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Doctors />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/:id"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <UserDetail />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor-schedule"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <DoctorSchedule />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AdminAuthProvider>
  );
}

export default App;
