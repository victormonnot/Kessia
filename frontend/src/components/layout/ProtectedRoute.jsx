import { Navigate, useLocation } from "react-router-dom";

import { useAuthStore } from "@/store/authStore";

export default function ProtectedRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const location = useLocation();

  if (!user && !refreshToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
