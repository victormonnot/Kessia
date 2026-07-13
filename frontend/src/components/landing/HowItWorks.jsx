import { FileCheck, LockKeyhole, MessagesSquare, Search } from "lucide-react";

import Reveal from "@/components/motion/Reveal";

// « Comment ça marche » — 4 étapes posées sur la ligne orange du héro, couchée
// à l'horizontale : le process traverse la section comme il traverse le héro.
const STEPS = [
  {
    n: 1,
    icon: Search,
    title: "Choisissez ou décrivez",
    text: "Parcourez les annonces ou publiez une demande sur mesure : les rédacteurs de votre spécialité répondent.",
  },
  {
    n: 2,
    icon: LockKeyhole,
    title: "Payez sous séquestre",
    text: "Le montant est bloqué via Stripe. Le rédacteur n'est payé qu'après votre validation — remboursement automatique en cas d'annulation.",
  },
  {
    n: 3,
    icon: MessagesSquare,
    title: "Suivez la rédaction",
    text: "Brief, fichiers, messagerie en temps réel et demandes de révision : tout est tracé dans l'espace de commande.",
  },
  {
    n: 4,
    icon: FileCheck,
    title: "Validez, c'est livré",
    text: "Téléchargez le document, validez la livraison : les fonds sont versés. Laissez ensuite votre avis.",
  },
];

// La ligne orange du héro, couchée à l'horizontale derrière les cartes (lg+).
// Points de contrôle réglés pour que la ligne se faufile entre les 4 cartes
// (les cartes 2 et 4 sont décalées vers le bas).
function ProcessFlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-56 -translate-y-1/3 select-none lg:block"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        fill="none"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="process-orange" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F2620F" />
            <stop offset="1" stopColor="#F7943F" />
          </linearGradient>
        </defs>
        <path
          d="M -2 35 C 15 60, 32 15, 50 45 C 68 75, 84 20, 102 50"
          stroke="url(#process-orange)"
          strokeWidth="26"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          opacity="0.4"
        />
      </svg>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section className="relative overflow-hidden border-y bg-secondary/60">
      <ProcessFlow />
      <div className="container relative py-12 sm:py-16">
        <Reveal>
          <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Simple et sécurisé
          </span>
          <h2 className="mt-4 text-2xl sm:text-3xl">Comment ça marche</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            De la demande au document final, tout se passe sur Kessia — et le
            paiement est protégé à chaque étape.
          </p>
        </Reveal>

        {/* relative : les cartes passent au-dessus de la ligne absolue. */}
        <div className="relative mt-12 grid gap-8 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1}>
              {/* Décalage vertical des cartes 2 et 4 sur un div interne, pour
                  ne pas entrer en conflit avec le transform d'apparition. */}
              <div className={i % 2 === 1 ? "h-full lg:translate-y-8" : "h-full"}>
                <div className="relative h-full rounded-2xl border bg-card p-5 pt-7 shadow-md">
                  <span className="absolute -top-4 left-5 flex size-8 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background ring-4 ring-[hsl(var(--secondary))]">
                    {s.n}
                  </span>
                  {/* Carte 4 : signature « Livré » de la DeliveredCard du héro. */}
                  {s.n === 4 && (
                    <span className="absolute right-4 top-4 text-xs font-bold text-emerald-600 underline decoration-2 underline-offset-2">
                      Livré
                    </span>
                  )}
                  <h3 className="flex items-center gap-2 font-semibold">
                    <s.icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    {s.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{s.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
