import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";

export default function ProposalRow({ proposal, canDecide, onDecide }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-neutral-200 py-3 last:border-0">
      <div>
        <p className="text-sm font-medium text-neutral-900">
          {proposal.writer?.first_name} {proposal.writer?.last_name}{" "}
          <span className="font-normal text-neutral-500">
            · {Number(proposal.price).toFixed(0)} €
          </span>
        </p>
        <p className="mt-1 whitespace-pre-line text-sm text-neutral-700">
          {proposal.message}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={proposal.status} />
        {canDecide && proposal.status === "pending" && (
          <>
            <Button size="sm" onClick={() => onDecide(proposal.id, "accepted")}>
              Accepter
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDecide(proposal.id, "rejected")}
            >
              Rejeter
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
