import { Link } from "react-router-dom";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import { SPECIALTY_OPTIONS, labelFor } from "@/lib/choices";

export default function RequestCard({ request }) {
  return (
    <Link to={`/requests/${request.id}`} className="block">
      <Card className="h-full transition hover:border-primary-500">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-neutral-900">{request.title}</h3>
          <StatusBadge status={request.status} />
        </div>
        <p className="mt-1 text-sm text-neutral-600">
          Échéance : {request.deadline} · Budget : {Number(request.budget).toFixed(0)} €
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="primary">
            {labelFor(request.specialty, SPECIALTY_OPTIONS)}
          </Badge>
          <Badge>{request.proposals_count ?? 0} propositions</Badge>
        </div>
      </Card>
    </Link>
  );
}
