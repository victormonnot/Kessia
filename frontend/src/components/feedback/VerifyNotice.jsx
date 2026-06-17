import { MailWarning } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import Spinner from "@/components/feedback/Spinner";
import { errorMessage } from "@/lib/format";
import { useResendVerification } from "@/hooks/useAuth";
import useCooldown from "@/hooks/useCooldown";

// Shown in place of a gated action for users who haven't confirmed their email.
export default function VerifyNotice({
  message = "Confirmez votre adresse e-mail pour accéder à cette action.",
}) {
  const resend = useResendVerification();
  const cooldown = useCooldown(60);

  const onResend = async () => {
    try {
      await resend.mutateAsync();
      cooldown.start();
      toast.success("E-mail de confirmation renvoyé. Vérifiez votre boîte mail.");
    } catch (e) {
      toast.error(errorMessage(e, "Impossible de renvoyer l'e-mail."));
    }
  };

  return (
    <div className="container max-w-xl py-16">
      <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
        <MailWarning className="mx-auto size-10 text-amber-500" />
        <h1 className="mt-4 text-xl font-bold tracking-tight">Confirmez votre adresse e-mail</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <Button className="mt-6" onClick={onResend} disabled={resend.isPending || cooldown.active}>
          {resend.isPending ? (
            <>
              <Spinner /> Envoi…
            </>
          ) : cooldown.active ? (
            `Renvoyer l'e-mail (${cooldown.remaining}s)`
          ) : (
            "Renvoyer l'e-mail de confirmation"
          )}
        </Button>
      </div>
    </div>
  );
}
