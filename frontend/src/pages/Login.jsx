import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { useLogin } from "@/hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await login.mutateAsync(form);
      const dest = location.state?.from?.pathname || "/listings";
      navigate(dest, { replace: true });
    } catch (err) {
      const detail = err.response?.data?.detail || "Identifiants invalides";
      setError(detail);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Card>
        <h1 className="text-2xl font-semibold text-neutral-900">Se connecter</h1>
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <Input
            label="E-mail"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={onChange}
          />
          <Input
            label="Mot de passe"
            name="password"
            type="password"
            required
            value={form.password}
            onChange={onChange}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={login.isPending}>
            {login.isPending ? "Connexion en cours…" : "Se connecter"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-neutral-600">
          Pas encore de compte ?{" "}
          <Link to="/register" className="text-primary-700 hover:underline">
            S'inscrire
          </Link>
        </p>
      </Card>
    </div>
  );
}
