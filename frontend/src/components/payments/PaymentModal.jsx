import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { paymentsApi } from "@/api/payments";
import { useConfirmPayment } from "@/hooks/usePayments";

function CheckoutForm({ orderId, onClose }) {
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
      await confirm.mutateAsync(orderId);
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
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Annuler
        </Button>
        <Button type="submit" disabled={!stripe || submitting}>
          {submitting ? "Paiement…" : "Payer"}
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
        if (active) {
          setError(e?.response?.data?.detail || "Impossible d'initialiser le paiement.");
        }
      });
    return () => {
      active = false;
    };
  }, [open, order.id]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Payer ${Number(order.amount).toFixed(2)} ${order.currency || "EUR"}`}
    >
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!error && !clientSecret && (
        <p className="text-neutral-500">Initialisation du paiement…</p>
      )}
      {clientSecret && stripePromise && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm orderId={order.id} onClose={onClose} />
        </Elements>
      )}
    </Modal>
  );
}
