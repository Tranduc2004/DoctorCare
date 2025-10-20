import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./pages/Home/Home";
import PharmacyLogin from "./pages/Auth/Login";
import PharmacyRegister from "./pages/Auth/Register";
import Categories from "./pages/Categories/Categories";
import Products from "./pages/Products/Products";
import Medicines from "./pages/Medicines";
import Layout from "./components/Layout/Layout";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<PharmacyLogin />} />
          <Route path="/register" element={<PharmacyRegister />} />

          {/*Home and Dashboard - Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <HomePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacy"
            element={
              <ProtectedRoute>
                <Layout>
                  <HomePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <HomePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <Layout>
                  <Products />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <ProtectedRoute>
                <Layout>
                  <Categories />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/medicines"
            element={
              <ProtectedRoute>
                <Layout>
                  <Medicines />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={
              <div className="flex items-center justify-center h-screen">
                <h1 className="text-3xl font-bold">404 - Page Not Found</h1>
              </div>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
