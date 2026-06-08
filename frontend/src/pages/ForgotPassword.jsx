import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
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
import { forgotPasswordSchema } from "@/lib/schemas/auth";
import { errorMessage } from "@/lib/format";
import { useRequestPasswordReset } from "@/hooks/useAuth";

export default function ForgotPassword() {
  const [sentTo, setSentTo] = useState(null);
  const requestReset = useRequestPasswordReset();
  const form = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async ({ email }) => {
    try {
      await requestReset.mutateAsync(email);
      // The API answers the same way whether or not the account exists, so we
      // always show the confirmation (no account enumeration).
      setSentTo(email);
    } catch (err) {
      toast.error(errorMessage(err, "Impossible d'envoyer l'e-mail de réinitialisation."));
    }
  };

  if (sentTo) {
    return (
      <AuthLayout
        title="Vérifiez votre boîte mail"
        subtitle="La suite se passe dans votre messagerie."
        footer={
          <Link to="/login" className="font-medium text-primary hover:underline">
            Retour à la connexion
          </Link>
        }
      >
        <div className="rounded-lg border bg-muted/40 p-6 text-center">
          <MailCheck className="mx-auto size-10 text-primary" />
          <p className="mt-4 text-sm text-foreground">
            Si un compte est associé à <span className="font-medium">{sentTo}</span>, un e-mail
            contenant un lien de réinitialisation vient d'être envoyé.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Pensez à vérifier vos spams. Le lien n'est valable que quelques jours.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Mot de passe oublié"
      subtitle="Saisissez votre e-mail pour recevoir un lien de réinitialisation."
      footer={
        <>
          Vous vous souvenez de votre mot de passe ?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="vous@exemple.fr"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={requestReset.isPending}>
            {requestReset.isPending ? (
              <>
                <Spinner /> Envoi en cours…
              </>
            ) : (
              "Envoyer le lien"
            )}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
