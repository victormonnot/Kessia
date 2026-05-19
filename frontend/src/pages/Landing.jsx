import { Link } from "react-router-dom";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function Landing() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
          La rédaction médicale, à la demande.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
          Kessia met en relation médecins et institutions avec des rédacteurs scientifiques
          qualifiés — articles de revue, études de cas, résumés, et plus encore.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/register">
            <Button size="lg">S'inscrire</Button>
          </Link>
          <Link to="/listings">
            <Button size="lg" variant="outline">
              Parcourir les annonces
            </Button>
          </Link>
        </div>
      </section>

      <section className="mt-20 grid gap-4 sm:grid-cols-3">
        <Card>
          <h3 className="font-semibold text-neutral-900">Pour les médecins</h3>
          <p className="mt-2 text-sm text-neutral-600">
            Parcourez les annonces, passez commande ou publiez une demande sur mesure.
          </p>
        </Card>
        <Card>
          <h3 className="font-semibold text-neutral-900">Pour les rédacteurs</h3>
          <p className="mt-2 text-sm text-neutral-600">
            Publiez vos services, recevez des commandes et répondez aux demandes ouvertes.
          </p>
        </Card>
        <Card>
          <h3 className="font-semibold text-neutral-900">Spécialisé</h3>
          <p className="mt-2 text-sm text-neutral-600">
            Filtrez par spécialité et type de livrable — pensé pour la rédaction médicale.
          </p>
        </Card>
      </section>
    </div>
  );
}
