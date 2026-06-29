import { Clock } from "lucide-react";

import { ORDER_EVENT_META } from "@/lib/orderEvents";
import { formatDateTime, fullName } from "@/lib/format";

export default function OrderTimeline({ events = [] }) {
  if (!events.length) {
    return <p className="text-sm text-muted-foreground">Aucune activité pour le moment.</p>;
  }

  return (
    <ol className="space-y-4">
      {events.map((event) => {
        const meta = ORDER_EVENT_META[event.type] || { label: event.type, icon: Clock };
        const Icon = meta.icon;
        const detail =
          event.type === "document_added"
            ? event.metadata?.filename
            : event.type === "revision_requested"
              ? event.metadata?.note
              : null;
        return (
          <li key={event.id} className="flex gap-3 text-sm">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
              <Icon className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="font-medium leading-tight">{meta.label}</p>
              {detail && <p className="truncate text-xs text-foreground/80">{detail}</p>}
              <p className="text-xs text-muted-foreground">
                {event.actor ? `${fullName(event.actor)} · ` : ""}
                {formatDateTime(event.created_at)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
