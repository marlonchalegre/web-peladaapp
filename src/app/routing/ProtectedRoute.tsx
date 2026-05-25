import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../providers/AuthContext";

export default function ProtectedRoute() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/" replace />;

  if (
    user?.is_blocked &&
    location.pathname !== "/home" &&
    location.pathname !== "/profile"
  ) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
