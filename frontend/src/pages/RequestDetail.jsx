import { Link, useParams } from "react-router-dom";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import ProposalForm from "@/components/requests/ProposalForm";
import ProposalRow from "@/components/requests/ProposalRow";
import {
  useCreateProposal,
  useProposals,
  useRequest,
  useUpdateProposal,
} from "@/hooks/useRequests";
import { useAuthStore } from "@/store/authStore";
import { SPECIALTY_OPTIONS, labelFor } from "@/lib/choices";

export default function RequestDetail() {
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);
  const { data: request, isLoading } = useRequest(id);
  const { data: proposals = [] } = useProposals(user ? id : null);
  const createProposal = useCreateProposal(id);
  const updateProposal = useUpdateProposal(id);

  if (isLoading) return <p className="px-4 py-8 text-neutral-500">Chargement…</p>;
  if (!request) return <p className="px-4 py-8 text-neutral-500">Introuvable.</p>;

  const isOwner = user?.id === request.doctor?.id;
  const hasOwnProposal = proposals.some((p) => p.writer?.id === user?.id);
  const canSubmit =
    user?.is_writer && !isOwner && request.status === "open" && !hasOwnProposal;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">{request.title}</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Publiée par {request.doctor?.first_name} {request.doctor?.last_name} ·
            Échéance {request.deadline} · Budget {Number(request.budget).toFixed(0)} €
          </p>
          <div className="mt-2 flex gap-2">
            <Badge variant="primary">
              {labelFor(request.specialty, SPECIALTY_OPTIONS)}
            </Badge>
            <StatusBadge status={request.status} />
          </div>
        </div>
        {isOwner && (
          <Link to={`/requests/${request.id}/edit`}>
            <Button variant="outline">Modifier</Button>
          </Link>
        )}
      </div>

      <Card className="mt-6">
        <h2 className="font-semibold text-neutral-900">Description</h2>
        <p className="mt-2 whitespace-pre-line text-neutral-700">{request.description}</p>
      </Card>

      {canSubmit && (
        <Card className="mt-6">
          <h2 className="mb-3 font-semibold text-neutral-900">Envoyer une proposition</h2>
          <ProposalForm
            submitting={createProposal.isPending}
            onSubmit={(payload) => createProposal.mutateAsync(payload)}
          />
        </Card>
      )}

      {user && (
        <Card className="mt-6">
          <h2 className="mb-3 font-semibold text-neutral-900">
            {isOwner ? "Propositions reçues" : "Votre proposition"}
          </h2>
          {proposals.length === 0 ? (
            <p className="text-sm text-neutral-500">Aucune proposition pour le moment.</p>
          ) : (
            proposals.map((p) => (
              <ProposalRow
                key={p.id}
                proposal={p}
                canDecide={isOwner}
                onDecide={(pid, status) =>
                  updateProposal.mutate({ id: pid, payload: { status } })
                }
              />
            ))
          )}
        </Card>
      )}
    </div>
  );
}
