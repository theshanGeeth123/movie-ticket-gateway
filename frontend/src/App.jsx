import { Navigate, Route, Routes } from "react-router-dom";

import LoginPage from "./components/pages/auth/LoginPage";
import ProtectedRoute from "./components/routes/ProtectedRoute";

import DashboardRedirect from "./components/pages/dashboard/DashboardRedirect";
import AdminDashboard from "./components/pages/dashboard/AdminDashboard";
import StaffDashboard from "./components/pages/dashboard/StaffDashboard";
import CustomerDashboard from "./components/pages/dashboard/CustomerDashboard";

const App = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Common protected dashboard redirect */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardRedirect />} />
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Route>

      {/* Staff routes */}
      <Route element={<ProtectedRoute allowedRoles={["staff"]} />}>
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
      </Route>

      {/* Customer routes */}
      <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
        <Route path="/customer/dashboard" element={<CustomerDashboard />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;