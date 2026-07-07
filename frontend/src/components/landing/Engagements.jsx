import {
  BadgeCheck,
  ClipboardCheck,
  History,
  LockKeyhole,
  Scale,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import Reveal from "@/components/motion/Reveal";

// « Nos engagements » — remplace les faux témoignages par des garanties
// réelles et vérifiables (séquestre, vérification, ICMJE…). Pas de preuve
// sociale inventée : la section assume et l'annonce noir sur blanc.
const GUARANTEES = [
  {
    icon: BadgeCheck,
    title: "Profils vérifiés",
    text: "Chaque rédacteur soumet diplômes et qualifications ; notre équipe les contrôle avant d'attribuer le badge Profil vérifié.",
  },
  {
    icon: LockKeyhole,
    title: "Paiement sous séquestre",
    text: "Les fonds sont bloqués via Stripe jusqu'à validation de la livraison. Commande annulée ? Remboursement automatique.",
  },
  {
    icon: Scale,
    title: "Rédaction déclarée, jamais fantôme",
    text: "Kessia défend une rédaction déclarée, conforme aux recommandations ICMJE et COPE : la contribution du rédacteur a vocation à être reconnue en toute transparence, jamais cachée.",
  },
  {
    icon: History,
    title: "Révisions encadrées",
    text: "Chaque demande de révision est tracée dans l'espace de commande, avec un délai ajusté en conséquence.",
  },
  {
    icon: ClipboardCheck,
    title: "Avis 100 % authentiques",
    text: "Seul le client d'une commande terminée peut noter un rédacteur. Aucun avis inventé — y compris sur cette page.",
  },
];

export default function Engagements() {
  return (
    <section className="relative overflow-hidden">
      {/* Pan de fond gris arrondi (recette KessiaScore) : ancre visuellement
          les cartes flottantes de droite, comme dans le héro. */}
      <div
        aria-hidden
        className="absolute inset-y-10 right-0 hidden w-[42%] rounded-l-[4rem] bg-secondary/50 lg:block"
      />
      <div className="container relative py-12 sm:py-16">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Colonne gauche : la liste des garanties, une par une. */}
          <Reveal>
            <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Nos engagements
            </span>
            <h2 className="mt-4 text-2xl sm:text-3xl">
              Des experts vérifiés, des garanties concrètes
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
              La confiance ne se déclare pas : elle se vérifie. Voilà ce que
              Kessia garantit, sur chaque commande.
            </p>
            <ul className="mt-8 space-y-6">
              {GUARANTEES.map((g) => (
                <li key={g.title} className="flex gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
                    <g.icon className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-semibold">{g.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{g.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Colonne droite : deux cartes flottantes sur le pan gris, en écho
              aux cartes du héro. Aucune identité ni montant inventés — des
              barres abstraites racontent l'histoire à leur place. */}
          <div className="relative hidden lg:block">
            {/* Carte A : chronologie du séquestre, du blocage au versement. */}
            <Reveal delay={0.15}>
              <div className="relative w-full max-w-xs rounded-2xl border bg-card p-5 shadow-xl">
                {/* Numéro de commande abstrait. */}
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 rounded-full bg-foreground/20" />
                  <div className="h-2 w-10 rounded-full bg-foreground/10" />
                </div>
                <ul className="mt-4 space-y-3 text-sm">
                  <li className="flex items-center gap-2.5">
                    <LockKeyhole className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span>Paiement bloqué</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="size-2 shrink-0 rounded-full bg-foreground/30" aria-hidden="true" />
                    <span>Rédaction en cours</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <BadgeCheck className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                    <span className="font-semibold text-emerald-700">
                      Livraison validée — fonds versés
                    </span>
                  </li>
                </ul>
              </div>
            </Reveal>

            {/* Carte B : profil vérifié — photo qui déborde en haut à gauche
                (anneau blanc), badge en haut à droite, identité en barres. */}
            <Reveal delay={0.28}>
              <div className="-mt-8 ml-auto relative w-full max-w-[15rem] rounded-2xl border bg-card p-5 pt-12 shadow-xl">
                <div className="absolute -top-7 left-5">
                  <Avatar className="size-14 ring-4 ring-card">
                    <AvatarImage src="/img/avatars/03.jpg" alt="" />
                    <AvatarFallback>
                      <span className="text-sm font-semibold">K.</span>
                    </AvatarFallback>
                  </Avatar>
                </div>
                <VerifiedBadge label="Profil vérifié" className="absolute right-4 top-4" />
                <div className="h-2 w-24 rounded-full bg-foreground/20" />
                <div className="mt-2 h-1.5 w-16 rounded-full bg-foreground/10" />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
