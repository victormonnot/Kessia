import { useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useToggleFavorite } from "@/hooks/useFavorites";
import { useAuthStore } from "@/store/authStore";

// Heart toggle for saving a listing/request. Optimistic: flips immediately,
// reverts on error. Stops the click from triggering a surrounding card link.
function FavoriteButtonInner({ type, id, favorited, className }) {
  const toggle = useToggleFavorite();
  const [fav, setFav] = useState(Boolean(favorited));

  const onClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !fav;
    setFav(next);
    try {
      await toggle.mutateAsync({ [type]: id });
    } catch {
      setFav(!next);
      toast.error("Action impossible pour le moment.");
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={fav}
      aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={cn(
        "grid size-9 place-content-center rounded-full border bg-card/90 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-card",
        className,
      )}
    >
      <Heart className={cn("size-[18px]", fav && "fill-primary text-primary")} />
    </button>
  );
}

// Wrapper: nothing for logged-out users (and the data hooks below never run,
// so cards render without a QueryClient in tests).
export default function FavoriteButton(props) {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;
  return <FavoriteButtonInner {...props} />;
}
