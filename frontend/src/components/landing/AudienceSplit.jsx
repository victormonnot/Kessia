import { Link } from "react-router-dom";
import { Check, PenLine, Stethoscope } from "lucide-react";

import { Button } from "@/components/ui/button";
import Reveal from "@/components/motion/Reveal";

// « Une plateforme, deux métiers » — proposition de valeur des deux côtés du
// marché (médecins ↔ rédacteurs). Complète « Comment ça marche » (générique) en
// s'adressant à chaque audience avec son propre CTA. Message clé : un seul
// compte suffit, le mode rédacteur s'active à tout moment (double casquette).
const AUDIENCES = [
  {
    icon: Stethoscope,
    eyebrow: "Médecins & chercheurs",
    title: "Déléguez votre rédaction médicale",
    points: [
      "Choisissez un rédacteur vérifié ou publiez une demande sur mesure",
      "Suivez l'avancement et échangez via la messagerie intégrée",
      "Paiement sous séquestre, versé seulement à la livraison validée",
    ],
    cta: { to: "/listings", label: "Trouver un rédacteur" },
    primary: true,
  },
  {
    icon: PenLine,
    eyebrow: "Rédacteurs scientifiques",
    title: "Valorisez votre expertise",
    points: [
      "Créez vos annonces et fixez librement vos tarifs",
      "Recevez des commandes qualifiées dans votre spécialité",
      "Soyez payé en toute sécurité, sans relance ni impayé",
    ],
    cta: { to: "/register", label: "Devenir rédacteur" },
    // Rappel du modèle « compte unique » : pas de second compte à créer.
    note: "Déjà inscrit ? Activez le mode rédacteur à tout moment depuis votre compte.",
    primary: false,
  },
];

export default function AudienceSplit() {
  return (
    <section className="container py-10 sm:py-14">
      <Reveal>
        <h2 className="text-2xl sm:text-3xl">Une plateforme, deux métiers</h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
          Un seul compte suffit : commandez comme médecin, activez le mode rédacteur quand vous
          voulez.
        </p>
      </Reveal>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {AUDIENCES.map((a, i) => (
          <Reveal key={a.eyebrow} delay={i * 0.1}>
            <div className="flex h-full flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md sm:p-8">
              <span
                className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs ${
                  a.primary
                    ? "bg-primary/10 font-semibold text-primary"
                    : "bg-secondary font-medium text-muted-foreground"
                }`}
              >
                <a.icon className="size-4" /> {a.eyebrow}
              </span>
              <h3 className="mt-4 text-xl font-semibold">{a.title}</h3>
              <ul className="mt-4 space-y-3">
                {a.points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-6">
                <Button asChild size="lg" variant={a.primary ? "default" : "outline"}>
                  <Link to={a.cta.to}>{a.cta.label}</Link>
                </Button>
                {a.note && (
                  <p className="mt-3 text-xs text-muted-foreground">{a.note}</p>
                )}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
