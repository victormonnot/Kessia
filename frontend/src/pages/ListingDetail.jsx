import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import WriterHeader from "@/components/writers/WriterHeader";
import ExperienceList from "@/components/writers/ExperienceList";
import PublicationList from "@/components/writers/PublicationList";
import FavoriteButton from "@/components/ui/FavoriteButton";
import EmptyState from "@/components/feedback/EmptyState";
import ErrorState from "@/components/feedback/ErrorState";
import PlaceOrderModal from "@/components/orders/PlaceOrderModal";
import { useListing } from "@/hooks/useListings";
import { useWriter } from "@/hooks/useWriters";
import { useStartConversation } from "@/hooks/useMessaging";
import { useAuthStore } from "@/store/authStore";
import { sectionVisible } from "@/lib/profile";
import { errorMessage, formatPrice } from "@/lib/format";
import { DELIVERABLE_OPTIONS, SPECIALTY_OPTIONS, labelFor } from "@/lib/choices";

function DetailSkeleton() {
  return (
    <div className="container max-w-5xl py-8">
      <Skeleton className="mb-4 h-4 w-32" />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
        <Skeleton className="h-56 w-full rounded-lg" />
      </div>
    </div>
  );
}

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: listing, isLoading, isError, isFetching, refetch } = useListing(id);
  const user = useAuthStore((s) => s.user);
  const [orderOpen, setOrderOpen] = useState(false);
  const startConversation = useStartConversation();

  const writerId = listing?.writer?.id;
  // Full public profile of the writer (rich fields the listing payload omits).
  const { data: writerProfile } = useWriter(writerId);

  // Recovering from a cached error (refetch in flight) renders as loading, not
  // as a flash of the error state.
  if (isLoading || (isError && isFetching)) return <DetailSkeleton />;
  if (isError) {
    return (
      <div className="container py-10">
        <ErrorState onRetry={refetch} />
      </div>
    );
  }
  if (!listing) {
    return (
      <div className="container py-10">
        <EmptyState
          title="Annonce introuvable"
          description="Cette annonce n'existe pas ou a été supprimée."
          action={
            <Button asChild>
              <Link to="/listings">Voir les annonces</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const writer = writerProfile || listing.writer;
  const isOwner = user?.id === writer?.id;
  const canOrder = user && !isOwner;
  const canContact = user && !isOwner;

  const experiences = writerProfile?.experiences || [];
  const publications = writerProfile?.publications || [];
  const featured = publications.filter((p) => p.is_featured);
  const pubsToShow = (featured.length ? featured : publications).slice(0, 3);
  const showExperiences =
    writerProfile && sectionVisible(writer, "experiences") && experiences.length > 0;
  const showPublications =
    writerProfile && sectionVisible(writer, "publications") && pubsToShow.length > 0;

  const contact = async () => {
    try {
      const conv = await startConversation.mutateAsync({ recipient: writer.id });
      navigate(`/messages/${conv.id}`);
    } catch (e) {
      toast.error(errorMessage(e, "Impossible d'ouvrir la conversation."));
    }
  };

  return (
    <div className="container max-w-5xl py-8">
      <Link
        to="/listings"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Toutes les annonces
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{listing.title}</h1>
              <FavoriteButton
                type="listing"
                id={listing.id}
                favorited={listing.is_favorited}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
                {labelFor(listing.specialty, SPECIALTY_OPTIONS)}
              </span>
              <span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
                {labelFor(listing.deliverable_type, DELIVERABLE_OPTIONS)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                <Clock className="size-4" /> Délai {listing.turnaround_days} jours
              </span>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">À propos de ce service</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {listing.description}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Le rédacteur</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <WriterHeader
                writer={writer}
                as="h2"
                showContact={canContact}
                onContact={contact}
                contacting={startConversation.isPending}
              />
              {writer?.bio && (
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {writer.bio}
                </p>
              )}
              {showExperiences && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Parcours</h3>
                  <ExperienceList items={experiences} />
                </div>
              )}
              {showPublications && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Publications sélectionnées</h3>
                  <PublicationList items={pubsToShow} />
                </div>
              )}
              <Button asChild variant="link" className="h-auto p-0">
                <Link to={`/redacteurs/${writer?.id}`}>Voir le profil complet</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <aside>
          <div className="sticky top-20 rounded-lg border bg-card p-6 shadow-sm">
            <p className="text-3xl font-bold text-foreground">{formatPrice(listing.price)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Livraison estimée sous {listing.turnaround_days} jours
            </p>
            <div className="mt-5 space-y-2">
              {canOrder && (
                <Button className="w-full" onClick={() => setOrderOpen(true)}>
                  Commander
                </Button>
              )}
              {canContact && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={contact}
                  disabled={startConversation.isPending}
                >
                  Contacter le rédacteur
                </Button>
              )}
              {!user && (
                <Button asChild className="w-full">
                  <Link to="/login" state={{ from: { pathname: `/listings/${listing.id}` } }}>
                    Se connecter pour commander
                  </Link>
                </Button>
              )}
              {isOwner && (
                <Button asChild variant="outline" className="w-full">
                  <Link to={`/listings/${listing.id}/edit`}>
                    <Pencil className="size-4" /> Modifier l'annonce
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </aside>
      </div>

      {canOrder && (
        <PlaceOrderModal listing={listing} open={orderOpen} onClose={() => setOrderOpen(false)} />
      )}
    </div>
  );
}
