import { useAuthStore } from "@/store/authStore";
import VerifyNotice from "@/components/feedback/VerifyNotice";

// Wrap action pages (create/edit). Unverified users see a "confirm your email"
// notice instead of the form. Assumes an outer ProtectedRoute/WriterRoute has
// already handled the unauthenticated case.
export default function VerifiedRoute({ children, message }) {
  const user = useAuthStore((s) => s.user);
  if (user && !user.is_email_verified) {
    return <VerifyNotice message={message} />;
  }
  return children;
}
