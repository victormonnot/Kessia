import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Spinner from "@/components/feedback/Spinner";
import { errorMessage } from "@/lib/format";
import { useConnectStatus, useOnboard } from "@/hooks/usePayments";

// Stripe Connect onboarding card — reused by the writer dashboard and settings.
export default function ConnectCard() {
  const { data: status, isLoading } = useConnectStatus();
  const onboard = useOnboard();

  const start = async () => {
    try {
      const { url } = await onboard.mutateAsync();
      window.location.href = url;
    } catch (e) {
      toast.error(errorMessage(e, "Impossible de démarrer la configuration Stripe."));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recevoir vos paiements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : status?.payouts_enabled ? (
          <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="size-4" /> Votre compte Stripe est configuré.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Configurez votre compte Stripe pour recevoir vos versements (commission plateforme de
              15 % déduite, versement à la finalisation de la commande).
            </p>
            <Button onClick={start} disabled={onboard.isPending}>
              {onboard.isPending ? (
                <>
                  <Spinner /> Redirection…
                </>
              ) : status?.has_account ? (
                "Continuer la configuration"
              ) : (
                "Configurer les paiements"
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
