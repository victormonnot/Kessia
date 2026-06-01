import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TextField, TextareaField } from "@/components/form/fields";
import Spinner from "@/components/feedback/Spinner";
import { profileSchema } from "@/lib/schemas/profile";
import { errorMessage } from "@/lib/format";
import { useAuthStore } from "@/store/authStore";
import { useUpdateProfile } from "@/hooks/useAuth";

export default function ProfileForm() {
  const user = useAuthStore((s) => s.user);
  const update = useUpdateProfile();
  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      bio: user?.bio || "",
    },
  });

  const submit = async (values) => {
    try {
      await update.mutateAsync(values);
      toast.success("Profil mis à jour.");
    } catch (e) {
      toast.error(errorMessage(e, "La mise à jour du profil a échoué."));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField control={form.control} name="first_name" label="Prénom" />
          <TextField control={form.control} name="last_name" label="Nom" />
        </div>
        <TextareaField
          control={form.control}
          name="bio"
          label="Bio"
          rows={4}
          placeholder="Présentez votre parcours, vos spécialités et votre approche…"
        />
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? (
            <>
              <Spinner /> Enregistrement…
            </>
          ) : (
            "Enregistrer"
          )}
        </Button>
      </form>
    </Form>
  );
}
