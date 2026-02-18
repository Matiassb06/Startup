import { Navigate, useLocation } from "react-router-dom";

import { getSession } from "../lib/session";

export function ProtectedRoute({ requiredRole, children }) {
  const location = useLocation();
  const session = getSession();

  if (!session?.role) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requiredRole && session.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}
