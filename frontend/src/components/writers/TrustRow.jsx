import { Briefcase, CalendarDays, Clock, Languages } from "lucide-react";

import { cn } from "@/lib/utils";
import { RESPONSE_TIME_OPTIONS, labelFor } from "@/lib/choices";

function memberSince(dateJoined) {
  if (!dateJoined) return null;
  const year = new Date(dateJoined).getFullYear();
  return Number.isNaN(year) ? null : year;
}

// Malt-style reassurance strip: a few writer stats as small bordered cards.
// Renders nothing when there's no signal to show.
export default function TrustRow({ writer, className }) {
  const stats = [];

  if (writer.completed_orders > 0) {
    stats.push({
      icon: Briefcase,
      label: "Commandes réalisées",
      value: writer.completed_orders,
    });
  }
  if (writer.response_time) {
    stats.push({
      icon: Clock,
      label: "Délai de réponse",
      value: labelFor(writer.response_time, RESPONSE_TIME_OPTIONS),
    });
  }
  if ((writer.languages || []).length > 0) {
    stats.push({ icon: Languages, label: "Langues", value: writer.languages.join(", ") });
  }
  const year = memberSince(writer.date_joined);
  if (year) {
    stats.push({ icon: CalendarDays, label: "Membre depuis", value: year });
  }

  if (stats.length === 0) return null;

  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-4", className)}>
      {stats.map((s) => (
        <div key={s.label} className="rounded-lg border bg-card p-3">
          <s.icon className="size-4 text-muted-foreground" aria-hidden="true" />
          <p className="mt-1 truncate text-sm font-semibold" title={String(s.value)}>
            {s.value}
          </p>
          <p className="text-xs text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
