import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BadgeCheck, FileText, MessagesSquare, Search, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ListingCard from "@/components/listings/ListingCard";
import ListingCardSkeleton from "@/components/listings/ListingCardSkeleton";
import { useListings } from "@/hooks/useListings";
import { coverFor } from "@/lib/demo-assets";
import { SPECIALTY_OPTIONS, labelFor } from "@/lib/choices";

// Spécialités mises en avant (chips du héro et tuiles de catégories).
const POPULAR_SPECIALTIES = ["cardiologie", "oncologie", "neurologie", "pediatrie", "psychiatrie"];
const CATEGORY_TILES = [
  "cardiologie",
  "neurologie",
  "pneumologie",
  "gastroenterologie",
  "ophtalmologie",
  "psychiatrie",
  "radiologie",
  "rhumatologie",
];

const STEPS = [
  {
    title: "Trouvez ou publiez",
    text: "Parcourez les annonces de rédacteurs ou publiez une demande sur mesure.",
  },
  {
    title: "Payez en sécurité",
    text: "Le paiement est placé sous séquestre et n'est versé qu'à la livraison validée.",
  },
  {
    title: "Recevez votre livrable",
    text: "Échangez via la messagerie, téléchargez le travail et laissez un avis.",
  },
];

const FEATURES = [
  { icon: ShieldCheck, title: "Paiement sécurisé", text: "Fonds sous séquestre via Stripe." },
  { icon: BadgeCheck, title: "Rédacteurs vérifiés", text: "Qualifications contrôlées, badge dédié." },
  { icon: MessagesSquare, title: "Messagerie intégrée", text: "Du devis à la livraison, au même endroit." },
  { icon: FileText, title: "Spécialisé médical", text: "36 spécialités, 5 types de livrables." },
];

// Rangée d'annonces réelles — la vitrine du catalogue sur la page d'accueil.
function PopularListings() {
  const { data, isLoading, isError } = useListings({ ordering: "-writer_rating" });
  const listings = (data?.results ?? []).slice(0, 4);

  if (isError || (!isLoading && listings.length === 0)) return null;

  return (
    <section className="container py-10 sm:py-14">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl">Annonces populaires</h2>
        <Link
          to="/listings"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Voir tout <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <ListingCardSkeleton key={i} />)
          : listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
      </div>
    </section>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(query.trim() ? `/listings?search=${encodeURIComponent(query.trim())}` : "/listings");
  };

  return (
    <div>
      {/* Héro — recherche d'abord, sobre et direct. */}
      <section className="border-b">
        <div className="container py-12 sm:py-16 lg:py-20">
          <h1 className="max-w-3xl text-balance text-3xl sm:text-4xl lg:text-5xl">
            Trouvez le bon rédacteur médical pour vos publications
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Articles de recherche, études de cas, résumés — rédigés par des rédacteurs
            scientifiques qualifiés et vérifiés.
          </p>

          <form onSubmit={submitSearch} className="mt-7 flex w-full max-w-2xl gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Essayez « article de revue en cardiologie »…"
                aria-label="Rechercher une annonce"
                className="h-11 pl-9"
              />
            </div>
            <Button type="submit" size="lg" className="h-11">
              Rechercher
            </Button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Populaire :</span>
            {POPULAR_SPECIALTIES.map((s) => (
              <Link
                key={s}
                to={`/listings?specialty=${s}`}
                className="rounded-full border px-3 py-1 text-sm font-medium text-foreground transition-colors hover:border-foreground"
              >
                {labelFor(s, SPECIALTY_OPTIONS)}
              </Link>
            ))}
          </div>

          <p className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-4" /> Paiement sous séquestre
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck className="size-4" /> Rédacteurs vérifiés
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FileText className="size-4" /> 36 spécialités
            </span>
          </p>
        </div>
      </section>

      {/* Vraies annonces dès l'accueil (masquée si l'API ne répond pas). */}
      <PopularListings />

      {/* Catégories — tuiles photo par spécialité. */}
      <section className="container py-10 sm:py-14">
        <h2 className="text-2xl sm:text-3xl">Parcourez par spécialité</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-8">
          {CATEGORY_TILES.map((s) => (
            <Link
              key={s}
              to={`/listings?specialty=${s}`}
              className="group overflow-hidden rounded-lg border bg-card transition-shadow hover:border-neutral-300 hover:shadow-md"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                <img
                  src={coverFor(s)}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <p className="truncate px-3 py-2.5 text-sm font-medium" title={labelFor(s, SPECIALTY_OPTIONS)}>
                {labelFor(s, SPECIALTY_OPTIONS)}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Comment ça marche + réassurance — bande grise compacte. */}
      <section className="border-y bg-secondary/60">
        <div className="container py-10 sm:py-14">
          <h2 className="text-2xl sm:text-3xl">Comment ça marche</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="flex gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 grid gap-6 border-t pt-8 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-3">
                <f.icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-semibold">{f.title}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final — bande bleu nuit, l'orange ne sert qu'au bouton. */}
      <section className="bg-foreground">
        <div className="container flex flex-col items-start gap-6 py-12 text-background sm:flex-row sm:items-center sm:justify-between sm:py-14">
          <div>
            <h2 className="text-2xl sm:text-3xl">Prêt à commencer ?</h2>
            <p className="mt-2 max-w-xl text-background/70">
              Créez votre compte médecin ou rédacteur en quelques minutes.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/register">Créer un compte</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
            >
              <Link to="/listings">Parcourir les annonces</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
