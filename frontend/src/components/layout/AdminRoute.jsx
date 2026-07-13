import { Navigate, useLocation } from "react-router-dom";

import { useAuthStore } from "@/store/authStore";

export default function AdminRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  // Admin = Django staff (is_staff). Non-admins are bounced to the home page.
  if (!user.is_staff) {
    return <Navigate to="/" replace />;
  }
  return children;
}
