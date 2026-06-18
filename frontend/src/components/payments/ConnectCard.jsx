import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { loadConnectAndInitialize } from "@stripe/connect-js";
import { ConnectAccountOnboarding, ConnectComponentsProvider } from "@stripe/react-connect-js";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Spinner from "@/components/feedback/Spinner";
import { errorMessage } from "@/lib/format";
import { paymentsApi } from "@/api/payments";
import { useConnectStatus } from "@/hooks/usePayments";

// Embedded Stripe Connect onboarding: the writer enters their identity and bank
// details inside Kessia (no redirect to Stripe). Stripe's component still does
// the KYC/compliance heavy lifting; it just renders in our page.
function EmbeddedOnboarding({ onDone }) {
  const [connect, setConnect] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    paymentsApi
      .connectSession()
      .then(({ publishable_key }) => {
        if (!active) return;
        setConnect(
          loadConnectAndInitialize({
            publishableKey: publishable_key,
            // Connect refreshes the (short-lived) account-session secret itself.
            fetchClientSecret: async () => (await paymentsApi.connectSession()).client_secret,
          }),
        );
      })
      .catch((e) => active && setError(errorMessage(e, "Impossible de charger la configuration.")));
    return () => {
      active = false;
    };
  }, []);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!connect) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner /> Chargement…
      </p>
    );
  }

  return (
    <ConnectComponentsProvider connectInstance={connect}>
      <ConnectAccountOnboarding onExit={onDone} />
    </ConnectComponentsProvider>
  );
}

// Payout setup card — reused by the writer dashboard and settings.
export default function ConnectCard() {
  const { data: status, isLoading, refetch } = useConnectStatus();
  const [onboarding, setOnboarding] = useState(false);

  const finish = () => {
    setOnboarding(false);
    refetch();
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
            <CheckCircle2 className="size-4" /> Vos coordonnées bancaires sont configurées.
          </p>
        ) : onboarding ? (
          <EmbeddedOnboarding onDone={finish} />
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Renseignez vos coordonnées bancaires pour recevoir vos versements (commission
              plateforme de 15 % déduite, versement à la finalisation de la commande).
            </p>
            <Button onClick={() => setOnboarding(true)}>
              {status?.has_account ? "Continuer la configuration" : "Configurer les paiements"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
