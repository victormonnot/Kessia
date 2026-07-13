import { Link, useLocation, useNavigate } from "react-router-dom";
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
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import { loginSchema } from "@/lib/schemas/auth";
import { errorMessage } from "@/lib/format";
import { useLogin } from "@/hooks/useAuth";

const DEMO_ACCOUNTS = [
  { label: "Médecin", email: "doctor@kessia.demo" },
  { label: "Rédacteur", email: "writer@kessia.demo" },
  // Temporary testing convenience — to be removed before launch.
  { label: "Admin", email: "admin@kessia.demo" },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values) => {
    try {
      await login.mutateAsync(values);
      const dest = location.state?.from?.pathname || "/listings";
      navigate(dest, { replace: true });
    } catch (err) {
      toast.error(errorMessage(err, "Identifiants invalides."));
    }
  };

  const fillDemo = (email) => {
    form.setValue("email", email, { shouldValidate: true });
    form.setValue("password", "demo1234", { shouldValidate: true });
  };

  return (
    <AuthLayout
      title="Se connecter"
      subtitle="Accédez à votre espace Kessia."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            S'inscrire
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mot de passe</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-primary hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <Button type="submit" className="w-full" disabled={login.isPending}>
            {login.isPending ? (
              <>
                <Spinner /> Connexion en cours…
              </>
            ) : (
              "Se connecter"
            )}
          </Button>
        </form>
      </Form>

      <GoogleLoginButton />

      <div className="mt-6 rounded-lg border bg-muted/40 p-4">
        <p className="text-xs font-medium text-muted-foreground">
          Comptes de démonstration (mot de passe : demo1234)
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((a) => (
            <Button
              key={a.email}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fillDemo(a.email)}
            >
              {a.label}
            </Button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}
