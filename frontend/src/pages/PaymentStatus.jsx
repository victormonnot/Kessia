import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LoadingBlock } from "@/components/feedback/Spinner";
import { paymentsApi } from "@/api/payments";

// Landing page any payment method redirects back to (and where in-page methods
// can be sent too). It reconciles the order server-side, then shows the outcome.
const VIEWS = {
  paid: {
    icon: CheckCircle2,
    tone: "text-green-600",
    title: "Paiement confirmé",
    body: "Les fonds sont sécurisés. Le rédacteur peut démarrer le travail.",
  },
  processing: {
    icon: Clock,
    tone: "text-amber-600",
    title: "Paiement en cours de traitement",
    body: "Votre paiement est en cours de validation. Vous serez notifié dès qu'il est confirmé — aucune action supplémentaire n'est requise.",
  },
  failed: {
    icon: XCircle,
    tone: "text-destructive",
    title: "Le paiement n'a pas abouti",
    body: "Aucun montant n'a été prélevé. Vous pouvez réessayer depuis votre commande.",
  },
};

// Prefer our backend's authoritative payment_status; fall back to Stripe's
// redirect_status query param if the sync call couldn't run (e.g. not signed in).
function resolveView(paymentStatus, redirectStatus) {
  if (paymentStatus === "held" || paymentStatus === "released") return "paid";
  if (paymentStatus === "processing") return "processing";
  if (paymentStatus === "failed" || paymentStatus === "unpaid") return "failed";
  if (redirectStatus === "succeeded") return "paid";
  if (redirectStatus === "processing") return "processing";
  return "failed";
}

export default function PaymentStatus() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const orderId = params.get("order");
  const redirectStatus = params.get("redirect_status");
  const [view, setView] = useState(null);

  useEffect(() => {
    let active = true;
    async function sync() {
      let paymentStatus = null;
      if (orderId) {
        try {
          paymentStatus = (await paymentsApi.confirm(orderId)).payment_status;
        } catch {
          // Fall back to Stripe's redirect_status below.
        }
      }
      if (active) setView(resolveView(paymentStatus, redirectStatus));
    }
    sync();
    return () => {
      active = false;
    };
  }, [orderId, redirectStatus]);

  if (!view) {
    return (
      <div className="container py-16">
        <LoadingBlock label="Vérification du paiement…" />
      </div>
    );
  }

  const { icon: Icon, tone, title, body } = VIEWS[view];
  return (
    <div className="container flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <Icon className={`h-12 w-12 ${tone}`} aria-hidden />
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground">{body}</p>
      <Button onClick={() => navigate("/dashboard/doctor")}>Voir mes commandes</Button>
    </div>
  );
}
