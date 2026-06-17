import { useNavigate, useParams } from "react-router-dom";
import { Star } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import WriterHeader from "@/components/writers/WriterHeader";
import TrustRow from "@/components/writers/TrustRow";
import ExperienceList from "@/components/writers/ExperienceList";
import PublicationList from "@/components/writers/PublicationList";
import PortfolioList from "@/components/writers/PortfolioList";
import RatingBreakdown from "@/components/writers/RatingBreakdown";
import ListingCard from "@/components/listings/ListingCard";
import ReviewCard from "@/components/reviews/ReviewCard";
import EmptyState from "@/components/feedback/EmptyState";
import ErrorState from "@/components/feedback/ErrorState";
import { useWriter } from "@/hooks/useWriters";
import { useWriterReviews } from "@/hooks/useReviews";
import { useStartConversation } from "@/hooks/useMessaging";
import { useAuthStore } from "@/store/authStore";
import { SPECIALTY_OPTIONS, labelFor } from "@/lib/choices";
import { sectionVisible } from "@/lib/profile";
import { errorMessage } from "@/lib/format";

function ProfileSkeleton() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="flex gap-6 rounded-xl border bg-card p-6">
        <Skeleton className="size-28 rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function WriterProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const { data: writer, isLoading, isError, refetch } = useWriter(id);
  const { data: reviews, isLoading: reviewsLoading } = useWriterReviews(id);
  const startConversation = useStartConversation();

  if (isLoading) return <ProfileSkeleton />;
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

  const canContact = me && me.id !== writer.id;
  const listings = writer.listings || [];
  const reviewItems = reviews?.results || [];
  const experiences = writer.experiences || [];
  const publications = writer.publications || [];
  const portfolio = writer.portfolio || [];
  const showTrust = sectionVisible(writer, "trust");
  const showPortfolio = sectionVisible(writer, "portfolio") && portfolio.length > 0;
  const showExperiences = sectionVisible(writer, "experiences") && experiences.length > 0;
  const showPublications = sectionVisible(writer, "publications") && publications.length > 0;
  const hasReviews = writer.reviews_count > 0;

  const contact = async () => {
    try {
      const conv = await startConversation.mutateAsync({ recipient: writer.id });
      navigate(`/messages/${conv.id}`);
    } catch (e) {
      toast.error(errorMessage(e, "Impossible d'ouvrir la conversation."));
    }
  };

  return (
    <div className="container max-w-4xl space-y-6 py-8">
      <div className="space-y-5 rounded-xl border bg-card p-6 shadow-sm">
        <WriterHeader
          writer={writer}
          large
          showContact={canContact}
          onContact={contact}
          contacting={startConversation.isPending}
        />
        {showTrust && <TrustRow writer={writer} />}
      </div>

      {writer.bio && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">À propos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {writer.bio}
            </p>
          </CardContent>
        </Card>
      )}

      {writer.specialties?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spécialités</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {writer.specialties.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
                >
                  {labelFor(s, SPECIALTY_OPTIONS)}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showPortfolio && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Réalisations</CardTitle>
          </CardHeader>
          <CardContent>
            <PortfolioList items={portfolio} />
          </CardContent>
        </Card>
      )}

      {showExperiences && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Parcours</CardTitle>
          </CardHeader>
          <CardContent>
            <ExperienceList items={experiences} />
          </CardContent>
        </Card>
      )}

      {showPublications && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Publications</CardTitle>
          </CardHeader>
          <CardContent>
            <PublicationList items={publications} />
          </CardContent>
        </Card>
      )}

      <section>
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

      <section>
        <h2 className="text-lg font-semibold">Avis</h2>
        {hasReviews && (
          <Card className="mt-3">
            <CardContent className="pt-6">
              <RatingBreakdown
                breakdown={writer.rating_breakdown}
                avg={writer.avg_rating}
                total={writer.reviews_count}
              />
            </CardContent>
          </Card>
        )}
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
