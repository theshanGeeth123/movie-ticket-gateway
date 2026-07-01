import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Loading from "../ui/Loading";

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, authLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (authLoading) return <div className="min-h-screen bg-slate-950 text-white"><Loading label="Checking authentication..." /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};

export default ProtectedRoute;
