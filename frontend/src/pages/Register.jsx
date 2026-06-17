import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import { registerSchema } from "@/lib/schemas/auth";
import { errorMessage } from "@/lib/format";
import { useRegister } from "@/hooks/useAuth";

export default function Register() {
  const navigate = useNavigate();
  const register = useRegister();
  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      accept_terms: false,
    },
  });

  const onSubmit = async (values) => {
    try {
      await register.mutateAsync(values);
      toast.success("Bienvenue sur Kessia !");
      navigate("/dashboard/doctor");
    } catch (err) {
      toast.error(errorMessage(err, "La création du compte a échoué."));
    }
  };

  return (
    <AuthLayout
      title="Créer un compte"
      subtitle="Rejoignez la marketplace de la rédaction médicale. Vous pourrez activer le mode rédacteur à tout moment."
      footer={
        <>
          Déjà un compte ?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom</FormLabel>
                  <FormControl>
                    <Input autoComplete="given-name" placeholder="Marie" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input autoComplete="family-name" placeholder="Durand" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mot de passe</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Au moins 8 caractères"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="accept_terms"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-start gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5"
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal leading-snug">
                    J'accepte les{" "}
                    <Link
                      to="/cgu"
                      target="_blank"
                      className="font-medium text-primary hover:underline"
                    >
                      conditions générales
                    </Link>{" "}
                    et la{" "}
                    <Link
                      to="/confidentialite"
                      target="_blank"
                      className="font-medium text-primary hover:underline"
                    >
                      politique de confidentialité
                    </Link>
                    .
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={register.isPending}>
            {register.isPending ? (
              <>
                <Spinner /> Création du compte…
              </>
            ) : (
              "S'inscrire"
            )}
          </Button>
        </form>
      </Form>

      <GoogleLoginButton />
    </AuthLayout>
  );
}
