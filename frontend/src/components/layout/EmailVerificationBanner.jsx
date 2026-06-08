import { MailWarning } from "lucide-react";
import { toast } from "sonner";

import { useAuthStore } from "@/store/authStore";
import { useResendVerification } from "@/hooks/useAuth";
import { errorMessage } from "@/lib/format";

// Site-wide notice for logged-in users who haven't confirmed their email yet.
// Renders nothing for guests or already-verified accounts.
export default function EmailVerificationBanner() {
  const user = useAuthStore((s) => s.user);
  const resend = useResendVerification();

  if (!user || user.is_email_verified) return null;

  const onResend = async () => {
    try {
      await resend.mutateAsync();
      toast.success("E-mail de confirmation renvoyé. Vérifiez votre boîte mail.");
    } catch (err) {
      toast.error(errorMessage(err, "Impossible de renvoyer l'e-mail."));
    }
  };

  return (
    <div className="border-b border-amber-200 bg-amber-50 text-amber-900">
      <div className="container flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
        <MailWarning className="size-4 shrink-0" />
        <span>Confirmez votre adresse e-mail pour sécuriser votre compte.</span>
        <button
          type="button"
          onClick={onResend}
          disabled={resend.isPending}
          className="font-semibold underline underline-offset-2 hover:no-underline disabled:opacity-60"
        >
          {resend.isPending ? "Envoi…" : "Renvoyer l'e-mail"}
        </button>
      </div>
    </div>
  );
}
