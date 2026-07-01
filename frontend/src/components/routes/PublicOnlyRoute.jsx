import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { roleHome } from "../../utils/formatters";
import Loading from "../ui/Loading";

const PublicOnlyRoute = () => {
  const { user, authLoading, isAuthenticated } = useAuth();
  if (authLoading) return <div className="min-h-screen bg-slate-950 text-white"><Loading /></div>;
  if (isAuthenticated) return <Navigate to={roleHome(user?.role)} replace />;
  return <Outlet />;
};

export default PublicOnlyRoute;
