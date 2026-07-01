import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { roleHome } from "../../utils/formatters";

const DashboardRedirect = () => {
  const { user } = useAuth();
  return <Navigate to={roleHome(user?.role)} replace />;
};

export default DashboardRedirect;
