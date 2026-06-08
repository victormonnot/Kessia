import { Navigate, useLocation } from "react-router-dom";

import { useAuthStore } from "@/store/authStore";

// Inverse of ProtectedRoute: keeps already-authenticated users off the
// login/register screens, sending them where they were headed (when bounced
// here by a protected route) or to the listings home.
export default function GuestRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (user) {
    const dest = location.state?.from?.pathname || "/listings";
    return <Navigate to={dest} replace />;
  }
  return children;
}
