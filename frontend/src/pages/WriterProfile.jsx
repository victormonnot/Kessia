import { useNavigate, useParams } from "react-router-dom";
import { BadgeCheck, FileText, MessageSquare, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import Badge from "@/components/ui/Badge";
import Stars from "@/components/ui/Stars";
import StatCard from "@/components/dashboard/StatCard";
import ListingCard from "@/components/listings/ListingCard";
import ReviewCard from "@/components/reviews/ReviewCard";
import EmptyState from "@/components/feedback/EmptyState";
import ErrorState from "@/components/feedback/ErrorState";
import { useWriter } from "@/hooks/useWriters";
import { useWriterReviews } from "@/hooks/useReviews";
import { useStartConversation } from "@/hooks/useMessaging";
import { useAuthStore } from "@/store/authStore";
import { SPECIALTY_OPTIONS, labelFor } from "@/lib/choices";
import { errorMessage, fullName, initials } from "@/lib/format";

function ProfileSkeleton() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="flex gap-6 rounded-xl border bg-card p-6">
        <Skeleton className="size-20 rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
    </div>
  );
}

export default function WriterProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const { data: writer, isLoading, isError, isFetching, refetch } = useWriter(id);
  const { data: reviews, isLoading: reviewsLoading } = useWriterReviews(id);
  const startConversation = useStartConversation();

  if (isLoading || (isError && isFetching)) return <ProfileSkeleton />;
  if (isError || !writer) {
    return (
      <div className="container py-10">
        <ErrorState
          title="Profil introuvable"
          description="Ce rédacteur n'existe pas ou n'est plus disponible."
          onRetry={refetch}
        />
      </div>
    );
  }

  const name = fullName(writer, "Rédacteur");
  const canContact = me && me.id !== writer.id;
  const listings = writer.listings || [];
  const reviewItems = reviews?.results || [];

  const contact = async () => {
    try {
      const conv = await startConversation.mutateAsync({ recipient: writer.id });
      navigate(`/messages/${conv.id}`);
    } catch (e) {
      toast.error(errorMessage(e, "Impossible d'ouvrir la conversation."));
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="rounded-xl border bg-card p-6 shadow-sm sm:flex sm:items-start sm:gap-6">
        <Avatar className="mx-auto size-20 sm:mx-0">
          <AvatarFallback className="bg-secondary text-2xl font-semibold text-foreground">
            {initials(writer)}
          </AvatarFallback>
        </Avatar>
        <div className="mt-4 flex-1 text-center sm:mt-0 sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
            {writer.is_verified && (
              <Badge variant="success">
                <BadgeCheck className="mr-1 size-3.5" /> Vérifié
              </Badge>
            )}
          </div>
          <div className="mt-1 flex justify-center sm:justify-start">
            {writer.reviews_count > 0 ? (
              <Stars rating={writer.avg_rating} count={writer.reviews_count} />
            ) : (
              <span className="text-sm text-muted-foreground">Pas encore d'avis</span>
            )}
          </div>
          {writer.specialties?.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {writer.specialties.map((s) => (
                <Badge key={s} variant="neutral">
                  {labelFor(s, SPECIALTY_OPTIONS)}
                </Badge>
              ))}
            </div>
          )}
          {writer.bio && (
            <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{writer.bio}</p>
          )}
        </div>
        {canContact && (
          <div className="mt-5 flex justify-center sm:mt-0">
            <Button onClick={contact} disabled={startConversation.isPending}>
              <MessageSquare className="size-4" /> Contacter
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Star}
          label="Note moyenne"
          value={writer.reviews_count > 0 ? Number(writer.avg_rating).toFixed(1) : "—"}
        />
        <StatCard icon={MessageSquare} label="Avis" value={writer.reviews_count ?? 0} />
        <StatCard icon={FileText} label="Annonces" value={listings.length} />
      </div>

      {/* Listings */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Annonces</h2>
        {listings.length > 0 ? (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Aucune annonce publiée pour le moment.
          </p>
        )}
      </section>

      {/* Reviews */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Avis</h2>
        {reviewsLoading ? (
          <div className="mt-3 space-y-3">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        ) : reviewItems.length > 0 ? (
          <div className="mt-3 space-y-3">
            {reviewItems.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-3"
            icon={Star}
            title="Aucun avis pour le moment"
            description="Les avis laissés par les médecins après une commande finalisée apparaîtront ici."
          />
        )}
      </section>
    </div>
  );
}
