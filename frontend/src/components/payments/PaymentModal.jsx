import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/feedback/Spinner";
import { paymentsApi } from "@/api/payments";
import { useConfirmPayment } from "@/hooks/usePayments";
import { errorMessage, formatPrice } from "@/lib/format";

function CheckoutForm({ order, onClose }) {
  const stripe = useStripe();
  const elements = useElements();
  const confirm = useConfirmPayment();
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });
    if (stripeError) {
      setError(stripeError.message || "Le paiement a échoué.");
      setSubmitting(false);
      return;
    }

    // Webhooks are the source of truth, but we sync immediately so the UI
    // reflects the payment without waiting (works without the Stripe CLI in dev).
    try {
      await confirm.mutateAsync(order.id);
      toast.success("Paiement effectué. Le rédacteur peut démarrer le travail.");
      onClose?.();
    } catch {
      setError("Paiement reçu, mais la synchronisation a échoué. Rafraîchissez la page.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Annuler
        </Button>
        <Button type="submit" disabled={!stripe || submitting}>
          {submitting ? (
            <>
              <Spinner /> Paiement…
            </>
          ) : (
            "Payer"
          )}
        </Button>
      </div>
    </form>
  );
}

export default function PaymentModal({ order, open, onClose }) {
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) {
      setClientSecret(null);
      setError(null);
      return undefined;
    }
    let active = true;
    paymentsApi
      .pay(order.id)
      .then((data) => {
        if (!active) return;
        setStripePromise(loadStripe(data.publishable_key));
        setClientSecret(data.client_secret);
      })
      .catch((e) => {
        if (active) setError(errorMessage(e, "Impossible d'initialiser le paiement."));
      });
    return () => {
      active = false;
    };
  }, [open, order.id]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Payer ${formatPrice(order.amount, order.currency)}`}
      description={order.listing?.title || "Paiement de la commande"}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-3 text-sm">
          <span className="font-medium">{order.listing?.title || "Commande"}</span>
          <span className="font-semibold text-primary">
            {formatPrice(order.amount, order.currency)}
          </span>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!error && !clientSecret && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner /> Initialisation du paiement…
          </p>
        )}
        {clientSecret && stripePromise && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm order={order} onClose={onClose} />
          </Elements>
        )}
      </div>
    </Modal>
  );
}
