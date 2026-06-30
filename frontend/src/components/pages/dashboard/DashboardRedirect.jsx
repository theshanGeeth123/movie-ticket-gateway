import { Navigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const DashboardRedirect = () => {
  const { user } = useAuth();

  if (user?.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (user?.role === "staff") {
    return <Navigate to="/staff/dashboard" replace />;
  }

  return <Navigate to="/customer/dashboard" replace />;
};

export default DashboardRedirect;