import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import { useCreateOrder } from "@/hooks/useOrders";

export default function PlaceOrderModal({ listing, open, onClose }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const create = useCreateOrder();

  const submit = async () => {
    setError(null);
    try {
      await create.mutateAsync({ listing: listing.id, message });
      onClose?.();
      navigate("/dashboard/doctor");
    } catch (err) {
      const detail = err.response?.data;
      setError(typeof detail === "string" ? detail : JSON.stringify(detail));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Commande : ${listing?.title || ""}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={create.isPending}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending ? "Envoi…" : "Passer commande"}
          </Button>
        </>
      }
    >
      <Textarea
        label="Consignes"
        name="message"
        rows={5}
        placeholder="Décrivez ce dont vous avez besoin."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </Modal>
  );
}
