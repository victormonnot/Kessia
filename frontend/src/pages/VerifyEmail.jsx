import { useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import Spinner from "@/components/feedback/Spinner";
import AuthLayout from "@/components/layout/AuthLayout";
import { useVerifyEmail } from "@/hooks/useAuth";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const uid = params.get("uid");
  const token = params.get("token");
  const verify = useVerifyEmail();

  // Verify automatically when the page opens, exactly once.
  const startedRef = useRef(false);
  useEffect(() => {
    if (uid && token && !startedRef.current) {
      startedRef.current = true;
      verify.mutate({ uid, token });
    }
  }, [uid, token, verify]);

  if (!uid || !token) {
    return (
      <AuthLayout
        title="Lien invalide"
        subtitle="Ce lien de confirmation est incomplet."
        footer={
          <Link to="/login" className="font-medium text-primary hover:underline">
            Retour à la connexion
          </Link>
        }
      >
        <p className="text-sm text-muted-foreground">
          Ouvrez le lien directement depuis l'e-mail de confirmation que vous avez reçu.
        </p>
      </AuthLayout>
    );
  }

  if (verify.isSuccess) {
    return (
      <AuthLayout title="Adresse confirmée" subtitle="Votre compte est désormais vérifié.">
        <div className="rounded-lg border bg-muted/40 p-6 text-center">
          <CheckCircle2 className="mx-auto size-10 text-emerald-600" />
          <p className="mt-4 text-sm text-foreground">
            Merci ! Votre adresse e-mail a bien été confirmée.
          </p>
          <Button asChild className="mt-6 w-full">
            <Link to="/listings">Continuer sur Kessia</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (verify.isError) {
    return (
      <AuthLayout
        title="Lien expiré"
        subtitle="Ce lien de confirmation n'est plus valide."
        footer={
          <Link to="/login" className="font-medium text-primary hover:underline">
            Retour à la connexion
          </Link>
        }
      >
        <div className="rounded-lg border bg-muted/40 p-6 text-center">
          <XCircle className="mx-auto size-10 text-destructive" />
          <p className="mt-4 text-sm text-foreground">
            Le lien est invalide ou a expiré. Connectez-vous pour en demander un nouveau depuis
            la bannière de vérification.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Confirmation en cours" subtitle="Un instant…">
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
        <Spinner /> Vérification de votre adresse e-mail…
      </div>
    </AuthLayout>
  );
}
