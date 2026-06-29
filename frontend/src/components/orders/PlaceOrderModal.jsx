import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Paperclip, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/feedback/Spinner";
import { ordersApi } from "@/api/orders";
import { useCreateOrder } from "@/hooks/useOrders";
import { errorMessage, formatBytes, formatPrice } from "@/lib/format";

export default function PlaceOrderModal({ listing, open, onClose }) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);
  const fileRef = useRef(null);
  const navigate = useNavigate();
  const create = useCreateOrder();

  const addFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length) setFiles((prev) => [...prev, ...picked]);
    e.target.value = ""; // allow re-picking the same file
  };

  const removeFile = (index) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const submit = async () => {
    try {
      const order = await create.mutateAsync({ listing: listing.id, message });

      // Upload the brief documents (if any) to the freshly created order. A
      // failed upload shouldn't lose the order — warn and still open it.
      if (files.length) {
        const results = await Promise.allSettled(
          files.map((file) => {
            const formData = new FormData();
            formData.append("file", file);
            return ordersApi.uploadAttachment(order.id, formData);
          }),
        );
        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed) toast.error(`${failed} document(s) n'ont pas pu être envoyés.`);
      }

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
        <div className="space-y-1.5">
          <Label>Documents sources (optionnel)</Label>
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            onChange={addFiles}
            aria-hidden="true"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            <Paperclip className="size-4" /> Ajouter des documents
          </Button>
          {files.length > 0 && (
            <ul className="space-y-1.5 pt-1">
              {files.map((file, i) => (
                <li
                  key={`${file.name}-${i}`}
                  className="flex items-center gap-2 rounded-md border bg-muted/40 px-2.5 py-1.5 text-xs"
                >
                  <Paperclip className="size-3.5 shrink-0" />
                  <span className="flex-1 truncate">{file.name}</span>
                  <span className="shrink-0 text-muted-foreground">{formatBytes(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    aria-label="Retirer le fichier"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
