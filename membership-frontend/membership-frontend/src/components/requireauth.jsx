import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useauth";

export default function RequireAuth({ children, allowedRoles }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    sessionStorage.setItem("redirectAfterLogin", location.pathname + location.search);
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on role
    if (user.role === "public") return <Navigate to="/public" replace />;
    if (user.role === "private") return <Navigate to="/dashboard/private" replace />;
    if (user.role === "admin") return <Navigate to="/dashboard" replace />;
    return <div className="p-6 text-red-600">Access denied. You do not have permission to view this page.</div>;
  }

  return children;
}
