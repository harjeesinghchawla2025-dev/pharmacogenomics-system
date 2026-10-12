
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

export default function ProtectedRoute({ allowedRoles }) {
  const { user } = useAuth();

  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  
  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
}


