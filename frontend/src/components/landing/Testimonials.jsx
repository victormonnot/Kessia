import { Quote } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Stars from "@/components/ui/Stars";
import { initialsFromName } from "@/lib/format";

// Avis illustratifs (contenu de démo) — à remplacer par de vrais témoignages
// une fois la plateforme lancée. Prénom + initiale : un ton sobre et respectueux
// de la vie privée, cohérent avec le reste du site.
const TESTIMONIALS = [
  {
    quote:
      "Protocole de recherche livré en quatre jours, parfaitement structuré. La rédactrice maîtrisait réellement le sujet.",
    name: "Dr Camille R.",
    role: "Cardiologue",
    avatar: "/img/avatars/02.jpg",
  },
  {
    quote:
      "La messagerie et le paiement sous séquestre m'ont mis en confiance dès la première commande. Je recommande sans hésiter.",
    name: "Dr Sofiane B.",
    role: "Oncologue",
    avatar: "/img/avatars/04.jpg",
  },
  {
    quote:
      "Je reçois des demandes qualifiées dans ma spécialité et je suis payée sans relance. Exactement ce qu'il me fallait.",
    name: "Élodie M.",
    role: "Rédactrice scientifique",
    avatar: "/img/avatars/07.jpg",
  },
];

export default function Testimonials() {
  return (
    <section className="border-y bg-secondary/40">
      <div className="container py-10 sm:py-14">
        <h2 className="text-2xl sm:text-3xl">Ils nous font confiance</h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
          Médecins et rédacteurs partagent leur expérience sur Kessia.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="flex flex-col rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <Stars rating={5} />
                <Quote className="size-7 text-primary/25" aria-hidden />
              </div>
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-foreground">
                « {t.quote} »
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t pt-4">
                <Avatar className="size-10">
                  <AvatarImage src={t.avatar} alt="" />
                  <AvatarFallback className="bg-secondary text-xs font-semibold">
                    {initialsFromName(t.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold leading-tight">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
