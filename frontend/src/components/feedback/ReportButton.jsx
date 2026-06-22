import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Flag } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/Modal";
import { reportContent } from "@/api/admin";
import { useAuthStore } from "@/store/authStore";
import { errorMessage } from "@/lib/format";

/** Lets a signed-in user flag a listing/request/review/user to the moderators. */
export default function ReportButton({ targetType, targetId, className }) {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const submit = useMutation({
    mutationFn: () => reportContent({ target_type: targetType, target_id: targetId, reason }),
    onSuccess: () => {
      toast.success("Signalement envoyé. Merci.");
      setOpen(false);
      setReason("");
    },
    onError: (e) => toast.error(errorMessage(e, "Envoi impossible.")),
  });

  if (!user) return null;

  return (
    <>
      <Button variant="ghost" size="sm" className={className} onClick={() => setOpen(true)}>
        <Flag className="size-4" /> Signaler
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Signaler ce contenu"
        description="Expliquez le problème aux modérateurs."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (reason.trim()) submit.mutate();
          }}
          className="space-y-3"
        >
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            rows={4}
            placeholder="Motif du signalement…"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={submit.isPending || !reason.trim()}>
              Envoyer
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
