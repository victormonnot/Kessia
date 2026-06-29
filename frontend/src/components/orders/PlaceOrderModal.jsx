import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/feedback/Spinner";
import { useCreateOrder } from "@/hooks/useOrders";
import { errorMessage, formatPrice } from "@/lib/format";

export default function PlaceOrderModal({ listing, open, onClose }) {
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const create = useCreateOrder();

  const submit = async () => {
    try {
      const order = await create.mutateAsync({ listing: listing.id, message });
      toast.success("Commande envoyée au rédacteur.");
      onClose?.();
      navigate(`/commandes/${order.id}`);
    } catch (err) {
      toast.error(errorMessage(err, "La commande n'a pas pu être passée."));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Passer commande"
      description={listing?.title}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={create.isPending}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending ? (
              <>
                <Spinner /> Envoi…
              </>
            ) : (
              "Passer commande"
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-3 text-sm">
          <span className="font-medium">{listing?.title}</span>
          <span className="font-semibold text-foreground">{formatPrice(listing?.price)}</span>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="order-message">Consignes (optionnel)</Label>
          <Textarea
            id="order-message"
            rows={5}
            placeholder="Décrivez ce dont vous avez besoin : objectifs, format attendu, références…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
