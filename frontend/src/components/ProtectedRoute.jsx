import { Navigate, useLocation } from "react-router-dom";

import { getSession, isAuthenticated } from "../lib/session";

export function ProtectedRoute({ requiredRole, children }) {
  const location = useLocation();
  const session = getSession();

  if (!isAuthenticated() || !session?.role) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requiredRole && session.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}
