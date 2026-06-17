import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TextField } from "@/components/form/fields";
import Spinner from "@/components/feedback/Spinner";
import { changePasswordSchema } from "@/lib/schemas/auth";
import { errorMessage } from "@/lib/format";
import { useChangePassword } from "@/hooks/useAuth";

export default function ChangePasswordForm() {
  const change = useChangePassword();
  const form = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current_password: "", new_password: "", confirm: "" },
  });

  const submit = async ({ current_password, new_password }) => {
    try {
      await change.mutateAsync({ current_password, new_password });
      toast.success("Mot de passe mis à jour.");
      form.reset();
    } catch (e) {
      toast.error(errorMessage(e, "La modification du mot de passe a échoué."));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-4" noValidate>
        <TextField
          control={form.control}
          name="current_password"
          label="Mot de passe actuel"
          type="password"
          autoComplete="current-password"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            control={form.control}
            name="new_password"
            label="Nouveau mot de passe"
            type="password"
            autoComplete="new-password"
          />
          <TextField
            control={form.control}
            name="confirm"
            label="Confirmer"
            type="password"
            autoComplete="new-password"
          />
        </div>
        <Button type="submit" disabled={change.isPending}>
          {change.isPending ? (
            <>
              <Spinner /> Mise à jour…
            </>
          ) : (
            "Changer le mot de passe"
          )}
        </Button>
      </form>
    </Form>
  );
}
