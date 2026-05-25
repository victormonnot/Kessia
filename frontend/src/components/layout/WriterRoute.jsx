import { Navigate, useLocation } from "react-router-dom";

import { useAuthStore } from "@/store/authStore";

export default function WriterRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (!user.is_writer) {
    return <Navigate to="/dashboard/doctor" replace />;
  }
  return children;
}
