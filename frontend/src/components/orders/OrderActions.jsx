import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, MessageSquare, RefreshCw, Star, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Modal from "@/components/ui/Modal";
import ConfirmButton from "@/components/ConfirmButton";
import Spinner from "@/components/feedback/Spinner";
import ReviewModal from "@/components/reviews/ReviewModal";
import PaymentModal from "@/components/payments/PaymentModal";
import { ordersApi } from "@/api/orders";
import { useRequestRevision, useUpdateOrderStatus, useUploadDeliverable } from "@/hooks/useOrders";
import { useStartConversation } from "@/hooks/useMessaging";
import { errorMessage, fullName } from "@/lib/format";

const CANCEL = {
  title: "Annuler la commande ?",
  description: "La commande sera annulée. Si elle a déjà été payée, un remboursement sera initié.",
  confirmLabel: "Annuler la commande",
  destructive: true,
};

// Plain status transitions per role/status. Paying (doctor, on accepted),
// delivering (writer, on in_progress) and downloading (doctor) are handled
// separately because they aren't plain status PATCHes. The writer no longer
// "starts" work — the doctor's payment moves accepted -> in_progress.
const TRANSITIONS = {
  writer: {
    pending: [
      { label: "Accepter", next: "accepted", variant: "default", success: "Commande acceptée." },
      {
        label: "Refuser",
        next: "declined",
        variant: "outline",
        success: "Commande refusée.",
        confirm: {
          title: "Refuser la commande ?",
          description: "Le médecin sera informé que vous avez refusé cette commande.",
          confirmLabel: "Refuser",
          destructive: true,
        },
      },
    ],
  },
  doctor: {
    pending: [
      {
        label: "Annuler",
        next: "cancelled",
        variant: "outline",
        success: "Commande annulée.",
        confirm: CANCEL,
      },
    ],
    accepted: [
      {
        label: "Annuler",
        next: "cancelled",
        variant: "outline",
        success: "Commande annulée.",
        confirm: CANCEL,
      },
    ],
    in_progress: [
      {
        label: "Annuler",
        next: "cancelled",
        variant: "outline",
        success: "Commande annulée.",
        confirm: CANCEL,
      },
    ],
    delivered: [
      {
        label: "Confirmer la réception",
        next: "completed",
        variant: "default",
        success: "Réception confirmée — paiement versé au rédacteur.",
        confirm: {
          title: "Confirmer la réception ?",
          description:
            "Le travail sera validé et le paiement versé au rédacteur. Cette action est définitive.",
          confirmLabel: "Confirmer",
        },
      },
    ],
  },
};

export default function OrderActions({ order, role, hideContact = false }) {
  const navigate = useNavigate();
  const update = useUpdateOrderStatus();
  const upload = useUploadDeliverable();
  const revise = useRequestRevision(order.id);
  const startConversation = useStartConversation();
  const [deliverOpen, setDeliverOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviseOpen, setReviseOpen] = useState(false);
  const [note, setNote] = useState("");
  const [revisionNote, setRevisionNote] = useState("");
  const fileRef = useRef(null);

  const transitions = TRANSITIONS[role]?.[order.status] || [];
  // No "Payer" while a payment is already settled or still processing (a slow
  // method like SEPA confirms via webhook); a failed attempt can be retried.
  const canPay =
    role === "doctor" &&
    order.status === "accepted" &&
    !["held", "released", "processing"].includes(order.payment_status);
  const paymentFailed = order.payment_status === "failed";
  const paymentProcessing = role === "doctor" && order.payment_status === "processing";
  const canDeliver = role === "writer" && order.status === "in_progress";
  const awaitingPayment = role === "writer" && order.status === "accepted";
  const canReview = role === "doctor" && order.status === "completed" && !order.has_review;
  const canRequestRevision = role === "doctor" && order.status === "delivered";
  const canDownload =
    role === "doctor" &&
    ["delivered", "completed"].includes(order.status) &&
    (order.deliverables?.length || 0) > 0;

  const busy = update.isPending || upload.isPending;
  const counterparty = role === "writer" ? order.doctor : order.writer;

  const runTransition = async (status, successMsg) => {
    try {
      await update.mutateAsync({ id: order.id, status });
      if (successMsg) toast.success(successMsg);
    } catch (e) {
      toast.error(errorMessage(e, "L'action a échoué."));
    }
  };

  const submitDelivery = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Veuillez sélectionner un fichier.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    if (note) formData.append("note", note);
    try {
      await upload.mutateAsync({ id: order.id, formData });
      toast.success("Travail livré.");
      setDeliverOpen(false);
      setNote("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      toast.error(errorMessage(e, "L'envoi du livrable a échoué."));
    }
  };

  const submitRevision = async () => {
    try {
      await revise.mutateAsync(revisionNote);
      toast.success("Révision demandée au rédacteur.");
      setReviseOpen(false);
      setRevisionNote("");
    } catch (e) {
      toast.error(errorMessage(e, "La demande de révision a échoué."));
    }
  };

  const contact = async () => {
    try {
      const conv = await startConversation.mutateAsync({ order: order.id });
      navigate(`/messages/${conv.id}`);
    } catch (e) {
      toast.error(errorMessage(e, "Impossible d'ouvrir la conversation."));
    }
  };

  const download = async (deliverable) => {
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
      toast.error(errorMessage(e, "Le téléchargement a échoué."));
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {transitions.map((t) =>
        t.confirm ? (
          <ConfirmButton
            key={t.next}
            size="sm"
            variant={t.variant}
            disabled={busy}
            title={t.confirm.title}
            description={t.confirm.description}
            confirmLabel={t.confirm.confirmLabel || t.label}
            destructive={t.confirm.destructive}
            onConfirm={() => runTransition(t.next, t.success)}
          >
            {t.label}
          </ConfirmButton>
        ) : (
          <Button
            key={t.next}
            size="sm"
            variant={t.variant}
            disabled={busy}
            onClick={() => runTransition(t.next, t.success)}
          >
            {t.label}
          </Button>
        ),
      )}

      {canPay && (
        <Button size="sm" disabled={busy} onClick={() => setPayOpen(true)}>
          {paymentFailed ? "Réessayer le paiement" : "Payer"}
        </Button>
      )}
      {paymentProcessing && (
        <span className="text-xs text-muted-foreground">Paiement en cours de traitement…</span>
      )}
      {awaitingPayment && (
        <span className="text-xs text-muted-foreground">En attente du paiement du médecin</span>
      )}
      {canDeliver && (
        <Button size="sm" disabled={busy} onClick={() => setDeliverOpen(true)}>
          <Upload className="size-4" /> Livrer
        </Button>
      )}
      {canDownload &&
        order.deliverables.map((d) => (
          <Button key={d.id} size="sm" variant="outline" onClick={() => download(d)}>
            <Download className="size-4" /> Télécharger
          </Button>
        ))}
      {canRequestRevision && (
        <Button
          size="sm"
          variant="outline"
          disabled={revise.isPending}
          onClick={() => setReviseOpen(true)}
        >
          <RefreshCw className="size-4" /> Demander une révision
        </Button>
      )}
      {canReview && (
        <Button size="sm" variant="outline" onClick={() => setReviewOpen(true)}>
          <Star className="size-4" /> Laisser un avis
        </Button>
      )}
      {!hideContact && (
        <Button size="sm" variant="ghost" onClick={contact} disabled={startConversation.isPending}>
          <MessageSquare className="size-4" /> Contacter
        </Button>
      )}

      <Modal
        open={deliverOpen}
        onClose={() => setDeliverOpen(false)}
        title="Livrer le travail finalisé"
        description="Téléversez le fichier livrable pour cette commande."
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
              {upload.isPending ? (
                <>
                  <Spinner /> Envoi…
                </>
              ) : (
                "Livrer"
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="deliverable-file">Fichier</Label>
            <input
              id="deliverable-file"
              ref={fileRef}
              type="file"
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deliverable-note">Note (optionnel)</Label>
            <Textarea
              id="deliverable-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Précisions sur le livrable…"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={reviseOpen}
        onClose={() => setReviseOpen(false)}
        title="Demander une révision"
        description="Le travail repassera « en cours » et le rédacteur sera notifié."
        footer={
          <>
            <Button variant="outline" onClick={() => setReviseOpen(false)} disabled={revise.isPending}>
              Annuler
            </Button>
            <Button onClick={submitRevision} disabled={revise.isPending}>
              {revise.isPending ? (
                <>
                  <Spinner /> Envoi…
                </>
              ) : (
                "Demander la révision"
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-1.5">
          <Label htmlFor="revision-note">Remarques (optionnel)</Label>
          <Textarea
            id="revision-note"
            rows={4}
            value={revisionNote}
            onChange={(e) => setRevisionNote(e.target.value)}
            placeholder="Précisez ce qui doit être corrigé…"
          />
        </div>
      </Modal>

      <PaymentModal order={order} open={payOpen} onClose={() => setPayOpen(false)} />
      <ReviewModal
        order={order}
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        writerName={fullName(counterparty)}
      />
    </div>
  );
}
