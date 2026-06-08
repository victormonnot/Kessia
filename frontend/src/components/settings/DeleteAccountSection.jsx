import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TextField } from "@/components/form/fields";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/feedback/Spinner";
import { deleteAccountSchema } from "@/lib/schemas/auth";
import { errorMessage } from "@/lib/format";
import { useDeleteAccount } from "@/hooks/useAuth";

export default function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const remove = useDeleteAccount();
  const form = useForm({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { current_password: "" },
  });

  const close = () => {
    setOpen(false);
    form.reset();
  };

  const submit = async (values) => {
    try {
      await remove.mutateAsync(values);
      toast.success("Votre compte a été supprimé.");
      navigate("/", { replace: true });
    } catch (e) {
      toast.error(errorMessage(e, "La suppression du compte a échoué."));
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <div>
        <p className="text-sm font-medium text-destructive">Supprimer mon compte</p>
        <p className="text-sm text-muted-foreground">Cette action est définitive et irréversible.</p>
      </div>
      <Button
        variant="outline"
        className="border-destructive/40 text-destructive hover:bg-destructive/10"
        onClick={() => setOpen(true)}
      >
        Supprimer
      </Button>

      <Modal
        open={open}
        onClose={close}
        title="Supprimer définitivement votre compte ?"
        description="Vos données seront supprimées et cette action ne peut pas être annulée. Saisissez votre mot de passe pour confirmer."
        footer={
          <>
            <Button variant="outline" onClick={close} disabled={remove.isPending}>
              Annuler
            </Button>
            <Button
              onClick={form.handleSubmit(submit)}
              disabled={remove.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {remove.isPending ? (
                <>
                  <Spinner /> Suppression…
                </>
              ) : (
                "Supprimer définitivement"
              )}
            </Button>
          </>
        }
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4" noValidate>
            <TextField
              control={form.control}
              name="current_password"
              label="Mot de passe"
              type="password"
              autoComplete="current-password"
            />
          </form>
        </Form>
      </Modal>
    </div>
  );
}
