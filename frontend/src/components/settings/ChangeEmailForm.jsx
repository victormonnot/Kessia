import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TextField } from "@/components/form/fields";
import Spinner from "@/components/feedback/Spinner";
import { changeEmailSchema } from "@/lib/schemas/auth";
import { errorMessage } from "@/lib/format";
import { useAuthStore } from "@/store/authStore";
import { useChangeEmail } from "@/hooks/useAuth";

export default function ChangeEmailForm() {
  const user = useAuthStore((s) => s.user);
  const change = useChangeEmail();
  const form = useForm({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: { new_email: "", confirm_email: "", current_password: "" },
  });

  const submit = async ({ new_email, current_password }) => {
    try {
      await change.mutateAsync({ new_email, current_password });
      toast.success("Adresse e-mail mise à jour. Un lien de confirmation vous a été envoyé.");
      form.reset();
    } catch (e) {
      toast.error(errorMessage(e, "La modification de l'e-mail a échoué."));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-4" noValidate>
        <p className="text-sm text-muted-foreground">
          Adresse actuelle : <span className="font-medium text-foreground">{user?.email}</span>
        </p>
        <TextField
          control={form.control}
          name="new_email"
          label="Nouvelle adresse e-mail"
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.fr"
        />
        <TextField
          control={form.control}
          name="confirm_email"
          label="Confirmer la nouvelle adresse e-mail"
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.fr"
          onPaste={(e) => e.preventDefault()}
        />
        <TextField
          control={form.control}
          name="current_password"
          label="Mot de passe"
          type="password"
          autoComplete="current-password"
          description="Pour confirmer que c'est bien vous."
        />
        <Button type="submit" disabled={change.isPending}>
          {change.isPending ? (
            <>
              <Spinner /> Mise à jour…
            </>
          ) : (
            "Changer l'e-mail"
          )}
        </Button>
      </form>
    </Form>
  );
}
