import { Link } from "react-router-dom";

import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-4xl font-bold text-neutral-900">404</h1>
      <p className="mt-2 text-neutral-600">La page que vous cherchez n'existe pas.</p>
      <Link to="/" className="mt-6 inline-block">
        <Button variant="outline">Retour à l'accueil</Button>
      </Link>
    </div>
  );
}
