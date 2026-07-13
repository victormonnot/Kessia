import { Link } from "react-router-dom";
import { CalendarDays, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StatusBadge from "@/components/ui/StatusBadge";
import FavoriteButton from "@/components/ui/FavoriteButton";
import { formatDate, formatPrice, fullName, initials } from "@/lib/format";
import { SPECIALTY_OPTIONS, labelFor } from "@/lib/choices";

export default function RequestCard({ request }) {
  const count = request.proposals_count ?? 0;
  const doctor = request.doctor;

  return (
    <Link
      to={`/requests/${request.id}`}
      className="group flex h-full flex-col rounded-lg border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          {request.title}
        </h3>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge status={request.status} />
          <FavoriteButton
            type="request"
            id={request.id}
            favorited={request.is_favorited}
            className="size-8"
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Avatar className="size-7">
          <AvatarImage src={doctor?.avatar || undefined} alt="" />
          <AvatarFallback className="bg-secondary text-xs font-semibold text-foreground">
            {initials(doctor)}
          </AvatarFallback>
        </Avatar>
        <span className="truncate text-sm text-muted-foreground">{fullName(doctor)}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="size-4" /> {formatDate(request.deadline)}
        </span>
        <span className="font-semibold text-foreground">{formatPrice(request.budget)}</span>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
          {labelFor(request.specialty, SPECIALTY_OPTIONS)}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          <Users className="size-3" /> {count} proposition{count > 1 ? "s" : ""}
        </span>
      </div>
    </Link>
  );
}
