import { useState } from "react";
import { Heart } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useToggleFavorite } from "@/hooks/useFavorites";
import { useAuthStore } from "@/store/authStore";

// Shared heart button — both the logged-in and logged-out variants render this.
function HeartButton({ fav, onClick, className }) {
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

  return <HeartButton fav={fav} onClick={onClick} className={className} />;
}

// Logged-out: the heart still shows, but clicking it invites the user to log in.
// No data hooks run here, so cards keep rendering without a QueryClient in tests.
function FavoriteButtonGuest({ className }) {
  const navigate = useNavigate();
  const location = useLocation();

  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toast.info("Connectez-vous pour enregistrer vos favoris.");
    navigate("/login", { state: { from: { pathname: location.pathname } } });
  };

  return <HeartButton fav={false} onClick={onClick} className={className} />;
}

export default function FavoriteButton(props) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <FavoriteButtonGuest className={props.className} />;
  return <FavoriteButtonInner {...props} />;
}
