import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Spinner from "@/components/feedback/Spinner";
import AuthLayout from "@/components/layout/AuthLayout";
import { resetPasswordSchema } from "@/lib/schemas/auth";
import { errorMessage } from "@/lib/format";
import { useConfirmPasswordReset } from "@/hooks/useAuth";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const uid = params.get("uid");
  const token = params.get("token");
  const confirmReset = useConfirmPasswordReset();

  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });

  // The link must carry both the uid and token the email embedded.
  if (!uid || !token) {
    return (
      <AuthLayout
        title="Lien invalide"
        subtitle="Ce lien de réinitialisation est incomplet ou a expiré."
        footer={
          <Link to="/forgot-password" className="font-medium text-primary hover:underline">
            Demander un nouveau lien
          </Link>
        }
      >
        <p className="text-sm text-muted-foreground">
          Ouvrez le lien directement depuis l'e-mail que vous avez reçu, ou demandez-en un
          nouveau.
        </p>
      </AuthLayout>
    );
  }

  const onSubmit = async ({ password }) => {
    try {
      await confirmReset.mutateAsync({ uid, token, password });
      toast.success("Mot de passe réinitialisé. Vous pouvez vous connecter.");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(errorMessage(err, "Lien invalide ou expiré. Demandez-en un nouveau."));
    }
  };

  return (
    <AuthLayout
      title="Nouveau mot de passe"
      subtitle="Choisissez un nouveau mot de passe pour votre compte."
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Retour à la connexion
        </Link>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nouveau mot de passe</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmer le mot de passe</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={confirmReset.isPending}>
            {confirmReset.isPending ? (
              <>
                <Spinner /> Réinitialisation…
              </>
            ) : (
              "Réinitialiser le mot de passe"
            )}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
