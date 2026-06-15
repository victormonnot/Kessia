import { useRef } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/feedback/Spinner";
import { useUpdateProfile } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { errorMessage, initials } from "@/lib/format";

const MAX_BYTES = 5 * 1024 * 1024; // 5 Mo

// Profile photo upload. Reuses the profile PATCH endpoint: a FormData payload
// makes axios send multipart, a JSON `{avatar: null}` clears it.
export default function AvatarUpload() {
  const user = useAuthStore((s) => s.user);
  const update = useUpdateProfile();
  const inputRef = useRef(null);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choisissez un fichier image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image trop lourde (5 Mo maximum).");
      return;
    }
    const data = new FormData();
    data.append("avatar", file);
    try {
      await update.mutateAsync(data);
      toast.success("Photo de profil mise à jour.");
    } catch (err) {
      toast.error(errorMessage(err, "L'envoi de la photo a échoué."));
    }
  };

  const remove = async () => {
    try {
      await update.mutateAsync({ avatar: null });
      toast.success("Photo de profil supprimée.");
    } catch (err) {
      toast.error(errorMessage(err, "La suppression a échoué."));
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-16">
        <AvatarImage src={user?.avatar || undefined} alt="" />
        <AvatarFallback className="bg-secondary text-lg font-semibold text-foreground">
          {initials(user)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFile}
          aria-hidden="true"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={update.isPending}
        >
          {update.isPending ? (
            <>
              <Spinner /> Envoi…
            </>
          ) : (
            "Changer la photo"
          )}
        </Button>
        {user?.avatar && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={remove}
            disabled={update.isPending}
          >
            Supprimer
          </Button>
        )}
      </div>
    </div>
  );
}
