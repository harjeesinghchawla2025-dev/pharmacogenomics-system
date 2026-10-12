
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

export default function ProtectedRoute({ allowedRoles }) {
  const { user } = useAuth();

  // If the user is not logged in, send them to login.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If the user's role is not allowed, send them to their profile.
  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
}


