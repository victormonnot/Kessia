import { Navigate, useLocation } from "react-router-dom";

import { useAuthStore } from "@/store/authStore";

export default function ProtectedRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  // The startup silent refresh clears `user` if the session can't be revived,
  // so a present `user` means an authenticated session.
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
