import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { useRegister } from "@/hooks/useAuth";

export default function Register() {
  const navigate = useNavigate();
  const register = useRegister();
  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
  });
  const [error, setError] = useState(null);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await register.mutateAsync(form);
      navigate("/dashboard/doctor");
    } catch (err) {
      const detail = err.response?.data;
      setError(typeof detail === "string" ? detail : JSON.stringify(detail));
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Card>
        <h1 className="text-2xl font-semibold text-neutral-900">Créer un compte</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Vous pourrez activer le mode rédacteur à tout moment.
        </p>
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
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Prénom"
              name="first_name"
              value={form.first_name}
              onChange={onChange}
            />
            <Input
              label="Nom"
              name="last_name"
              value={form.last_name}
              onChange={onChange}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={register.isPending}>
            {register.isPending ? "Création du compte…" : "S'inscrire"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-neutral-600">
          Déjà un compte ?{" "}
          <Link to="/login" className="text-primary-700 hover:underline">
            Se connecter
          </Link>
        </p>
      </Card>
    </div>
  );
}
