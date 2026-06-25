import { GraduationCap, MapPin, MessageSquare } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Stars from "@/components/ui/Stars";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import { cn } from "@/lib/utils";
import { sectionVisible } from "@/lib/profile";
import { fullName, initials } from "@/lib/format";

// Shared writer header used on both the listing detail and the public profile:
// photo, name + verified, headline, location/rating/experience, expertise tags,
// Scholar link and an optional contact button. `large` enlarges the photo/name
// for the hero at the top of a listing or profile.
export default function WriterHeader({
  writer,
  onContact,
  contacting,
  showContact,
  as: Tag = "h1",
  large = false,
}) {
  const name = fullName(writer, "Utilisateur");
  const expertise = sectionVisible(writer, "expertise") ? writer.expertise_areas || [] : [];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <Avatar
        className={cn(
          "mx-auto shrink-0 sm:mx-0",
          large ? "size-28 sm:size-32" : "size-24",
        )}
      >
        <AvatarImage src={writer.avatar || undefined} alt="" />
        <AvatarFallback className="bg-secondary text-2xl font-semibold text-foreground">
          {initials(writer)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 text-center sm:text-left">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <Tag
            className={cn(
              "font-semibold tracking-tight",
              large ? "text-3xl" : "text-2xl",
            )}
          >
            {name}
          </Tag>
          {writer.is_verified && <VerifiedBadge />}
        </div>
        {writer.headline && <p className="mt-1 text-muted-foreground">{writer.headline}</p>}

        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground sm:justify-start">
          {writer.is_writer &&
            (writer.reviews_count > 0 ? (
              <Stars rating={writer.avg_rating} count={writer.reviews_count} />
            ) : (
              <span>Pas encore d'avis</span>
            ))}
          {writer.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-4" /> {writer.city}
            </span>
          )}
          {writer.years_experience ? <span>{writer.years_experience} ans d'expérience</span> : null}
        </div>

        {expertise.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            {expertise.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {sectionVisible(writer, "scholar") && writer.google_scholar_url && (
          <a
            href={writer.google_scholar_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <GraduationCap className="size-4" /> Profil Google Scholar
          </a>
        )}
      </div>

      {showContact && (
        <Button onClick={onContact} disabled={contacting} className="mx-auto shrink-0 sm:mx-0">
          <MessageSquare className="size-4" /> Contacter
        </Button>
      )}
    </div>
  );
}
