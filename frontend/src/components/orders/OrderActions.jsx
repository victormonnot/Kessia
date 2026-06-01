import { useRef, useState } from "react";

import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import PaymentModal from "@/components/payments/PaymentModal";
import { ordersApi } from "@/api/orders";
import { useUpdateOrderStatus, useUploadDeliverable } from "@/hooks/useOrders";
import { useCreateReview } from "@/hooks/useReviews";

// Plain status transitions per role/status. Paying (doctor, on accepted),
// delivering (writer, on in_progress) and downloading (doctor) are handled
// separately below because they aren't plain status PATCHes. The writer no
// longer "starts" work — the doctor's payment moves accepted -> in_progress.
const TRANSITIONS = {
  writer: {
    pending: [
      { label: "Accepter", next: "accepted", variant: "primary" },
      { label: "Refuser", next: "declined", variant: "outline" },
    ],
  },
  doctor: {
    pending: [{ label: "Annuler", next: "cancelled", variant: "outline" }],
    accepted: [{ label: "Annuler", next: "cancelled", variant: "outline" }],
    in_progress: [{ label: "Annuler", next: "cancelled", variant: "outline" }],
    delivered: [
      { label: "Confirmer la réception", next: "completed", variant: "primary" },
    ],
  },
};

function errorText(err) {
  const detail = err?.response?.data?.detail ?? err?.response?.data;
  if (!detail) return "Une erreur est survenue.";
  return typeof detail === "string" ? detail : JSON.stringify(detail);
}

export default function OrderActions({ order, role }) {
  const update = useUpdateOrderStatus();
  const upload = useUploadDeliverable();
  const review = useCreateReview();
  const [error, setError] = useState(null);
  const [deliverOpen, setDeliverOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [note, setNote] = useState("");
  const fileRef = useRef(null);

  const transitions = TRANSITIONS[role]?.[order.status] || [];
  const canPay =
    role === "doctor" &&
    order.status === "accepted" &&
    !["held", "released"].includes(order.payment_status);
  const canDeliver = role === "writer" && order.status === "in_progress";
  const awaitingPayment = role === "writer" && order.status === "accepted";
  const canReview =
    role === "doctor" && order.status === "completed" && !order.has_review;
  const canDownload =
    role === "doctor" &&
    ["delivered", "completed"].includes(order.status) &&
    (order.deliverables?.length || 0) > 0;

  const busy = update.isPending || upload.isPending;

  const runTransition = (status) => {
    setError(null);
    update.mutate(
      { id: order.id, status },
      { onError: (e) => setError(errorText(e)) },
    );
  };

  const submitDelivery = async () => {
    setError(null);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Veuillez sélectionner un fichier.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    if (note) formData.append("note", note);
    try {
      await upload.mutateAsync({ id: order.id, formData });
      setDeliverOpen(false);
      setNote("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      setError(errorText(e));
    }
  };

  const submitReview = async () => {
    setError(null);
    try {
      await review.mutateAsync({ order: order.id, rating, comment });
      setReviewOpen(false);
      setComment("");
      setRating(5);
    } catch (e) {
      setError(errorText(e));
    }
  };

  const download = async (deliverable) => {
    setError(null);
    try {
      const blob = await ordersApi.downloadDeliverable(order.id, deliverable.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = deliverable.filename || "livrable";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-2">
        {transitions.map((t) => (
          <Button
            key={t.next}
            size="sm"
            variant={t.variant}
            disabled={busy}
            onClick={() => runTransition(t.next)}
          >
            {t.label}
          </Button>
        ))}
        {canPay && (
          <Button size="sm" disabled={busy} onClick={() => setPayOpen(true)}>
            Payer
          </Button>
        )}
        {awaitingPayment && (
          <span className="text-xs text-neutral-500">En attente du paiement du médecin</span>
        )}
        {canDeliver && (
          <Button size="sm" disabled={busy} onClick={() => setDeliverOpen(true)}>
            Livrer le travail
          </Button>
        )}
        {canDownload &&
          order.deliverables.map((d) => (
            <Button key={d.id} size="sm" variant="outline" onClick={() => download(d)}>
              Télécharger
            </Button>
          ))}
        {canReview && (
          <Button size="sm" variant="outline" onClick={() => setReviewOpen(true)}>
            Laisser un avis
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}

      <Modal
        open={deliverOpen}
        onClose={() => setDeliverOpen(false)}
        title="Livrer le travail finalisé"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setDeliverOpen(false)}
              disabled={upload.isPending}
            >
              Annuler
            </Button>
            <Button onClick={submitDelivery} disabled={upload.isPending}>
              {upload.isPending ? "Envoi…" : "Livrer"}
            </Button>
          </>
        }
      >
        <label className="mb-1 block text-sm font-medium text-neutral-700">Fichier</label>
        <input
          ref={fileRef}
          type="file"
          className="block w-full text-sm text-neutral-700 file:mr-3 file:rounded-md file:border-0 file:bg-primary-600 file:px-3 file:py-2 file:text-white hover:file:bg-primary-700"
        />
        <div className="mt-3">
          <Textarea
            label="Note (facultatif)"
            name="note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </Modal>

      <PaymentModal order={order} open={payOpen} onClose={() => setPayOpen(false)} />

      <Modal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        title="Évaluer le rédacteur"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setReviewOpen(false)}
              disabled={review.isPending}
            >
              Annuler
            </Button>
            <Button onClick={submitReview} disabled={review.isPending}>
              {review.isPending ? "Envoi…" : "Publier l'avis"}
            </Button>
          </>
        }
      >
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i)}
              className={`text-2xl ${i <= rating ? "text-amber-500" : "text-neutral-300"}`}
              aria-label={`${i} étoile${i > 1 ? "s" : ""}`}
            >
              ★
            </button>
          ))}
        </div>
        <div className="mt-3">
          <Textarea
            label="Commentaire (facultatif)"
            name="comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </Modal>
    </div>
  );
}
