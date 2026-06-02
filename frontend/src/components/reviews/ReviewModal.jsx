import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/feedback/Spinner";
import { cn } from "@/lib/utils";
import { errorMessage } from "@/lib/format";
import { useCreateReview } from "@/hooks/useReviews";

export default function ReviewModal({ order, open, onClose, writerName }) {
  const review = useCreateReview();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");

  const submit = async () => {
    try {
      await review.mutateAsync({ order: order.id, rating, comment });
      toast.success("Merci pour votre avis !");
      setComment("");
      setRating(5);
      onClose?.();
    } catch (err) {
      toast.error(errorMessage(err, "La publication de l'avis a échoué."));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Évaluer le rédacteur"
      description={writerName ? `Votre avis sur ${writerName}` : "Partagez votre expérience"}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={review.isPending}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={review.isPending}>
            {review.isPending ? (
              <>
                <Spinner /> Publication…
              </>
            ) : (
              "Publier l'avis"
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Label>Note</Label>
          <div className="mt-1.5 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i)}
                onMouseEnter={() => setHover(i)}
                aria-label={`${i} étoile${i > 1 ? "s" : ""}`}
                className="rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Star
                  className={cn(
                    "size-7 transition-colors",
                    i <= (hover || rating)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-transparent text-neutral-300",
                  )}
                />
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="review-comment">Commentaire (optionnel)</Label>
          <Textarea
            id="review-comment"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Décrivez votre expérience avec ce rédacteur…"
          />
        </div>
      </div>
    </Modal>
  );
}
