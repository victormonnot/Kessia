import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Pencil, User, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Badge from "@/components/ui/Badge";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/feedback/EmptyState";
import ErrorState from "@/components/feedback/ErrorState";
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
import { errorMessage, formatDate, formatPrice, fullName } from "@/lib/format";

function DetailSkeleton() {
  return (
    <div className="container max-w-4xl py-8">
      <Skeleton className="mb-4 h-4 w-32" />
      <Skeleton className="h-9 w-3/4" />
      <Skeleton className="mt-3 h-4 w-1/2" />
      <Skeleton className="mt-6 h-32 w-full rounded-lg" />
      <Skeleton className="mt-4 h-40 w-full rounded-lg" />
    </div>
  );
}

export default function RequestDetail() {
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);
  const { data: request, isLoading, isError, refetch } = useRequest(id);
  const { data: proposals = [] } = useProposals(user ? id : null);
  const createProposal = useCreateProposal(id);
  const updateProposal = useUpdateProposal(id);

  if (isLoading) return <DetailSkeleton />;
  if (isError) {
    return (
      <div className="container py-10">
        <ErrorState onRetry={refetch} />
      </div>
    );
  }
  if (!request) {
    return (
      <div className="container py-10">
        <EmptyState
          title="Demande introuvable"
          description="Cette demande n'existe pas ou a été supprimée."
          action={
            <Button asChild>
              <Link to="/requests">Voir les demandes</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const isOwner = user?.id === request.doctor?.id;
  const hasOwnProposal = proposals.some((p) => p.writer?.id === user?.id);
  const canSubmit = user?.is_writer && !isOwner && request.status === "open" && !hasOwnProposal;

  const onDecide = async (pid, status) => {
    try {
      await updateProposal.mutateAsync({ id: pid, payload: { status } });
      toast.success(
        status === "accepted" ? "Proposition acceptée — commande créée." : "Proposition rejetée.",
      );
    } catch (err) {
      toast.error(errorMessage(err, "L'action a échoué."));
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <Link
        to="/requests"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Toutes les demandes
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{request.title}</h1>
            <StatusBadge status={request.status} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <User className="size-4" /> {fullName(request.doctor)}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-4" /> Échéance {formatDate(request.deadline)}
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <Wallet className="size-4" /> {formatPrice(request.budget)}
            </span>
            <Badge variant="primary">{labelFor(request.specialty, SPECIALTY_OPTIONS)}</Badge>
          </div>
        </div>
        {isOwner && (
          <Button asChild variant="outline">
            <Link to={`/requests/${request.id}/edit`}>
              <Pencil className="size-4" /> Modifier
            </Link>
          </Button>
        )}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {request.description}
          </p>
        </CardContent>
      </Card>

      {canSubmit && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Envoyer une proposition</CardTitle>
          </CardHeader>
          <CardContent>
            <ProposalForm
              submitting={createProposal.isPending}
              onSubmit={(payload) => createProposal.mutateAsync(payload)}
            />
          </CardContent>
        </Card>
      )}

      {user && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">
              {isOwner ? `Propositions reçues (${proposals.length})` : "Votre proposition"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {proposals.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune proposition pour le moment.</p>
            ) : (
              <div className="-my-1">
                {proposals.map((p) => (
                  <ProposalRow
                    key={p.id}
                    proposal={p}
                    canDecide={isOwner}
                    deciding={updateProposal.isPending}
                    onDecide={onDecide}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!user && (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Connectez-vous en tant que rédacteur pour envoyer une proposition.
            </p>
            <Button asChild>
              <Link to="/login" state={{ from: { pathname: `/requests/${request.id}` } }}>
                Se connecter
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
