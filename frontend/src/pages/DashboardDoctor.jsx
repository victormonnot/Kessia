import { Link, useNavigate } from "react-router-dom";
import { ClipboardList, Inbox, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Tabs from "@/components/layout/Tabs";
import EmptyState from "@/components/feedback/EmptyState";
import ErrorState from "@/components/feedback/ErrorState";
import { LoadingBlock } from "@/components/feedback/Spinner";
import OrdersList from "@/components/orders/OrdersList";
import RequestCard from "@/components/requests/RequestCard";
import ProposalRow from "@/components/requests/ProposalRow";
import { useAllProposals, useDecideProposal, useRequests } from "@/hooks/useRequests";
import { useActivateWriter } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { errorMessage, fullName } from "@/lib/format";

function MyOrdersTab() {
  return (
    <OrdersList
      role="doctor"
      emptyTitle="Aucune commande"
      emptyDescription="Parcourez les annonces pour passer votre première commande."
      emptyAction={
        <Button asChild>
          <Link to="/listings">Voir les annonces</Link>
        </Button>
      }
    />
  );
}

function MyRequestsTab() {
  const { data, isLoading, isError, refetch } = useRequests({ mine: true });
  if (isLoading) return <LoadingBlock />;
  if (isError) return <ErrorState onRetry={refetch} />;
  const mine = data?.results || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link to="/requests/new">
            <Plus className="size-4" /> Nouvelle demande
          </Link>
        </Button>
      </div>
      {mine.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Aucune demande"
          description="Publiez une demande pour recevoir des propositions de rédacteurs."
          action={
            <Button asChild>
              <Link to="/requests/new">Publier une demande</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {mine.map((r) => (
            <RequestCard key={r.id} request={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProposalsReceivedTab() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, refetch } = useAllProposals();
  const decide = useDecideProposal();

  if (isLoading) return <LoadingBlock />;
  if (isError) return <ErrorState onRetry={refetch} />;

  // Proposals on the doctor's own requests (i.e. not authored by the doctor).
  const received = (data?.results || []).filter((p) => p.writer?.id !== user?.id);
  if (received.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Aucune proposition reçue"
        description="Les propositions envoyées à vos demandes apparaîtront ici."
      />
    );
  }

  // Group by request so the doctor sees offers per request.
  const groups = received.reduce((acc, p) => {
    (acc[p.request] ||= { title: p.request_title, items: [] }).items.push(p);
    return acc;
  }, {});

  const onDecide = async (id, status) => {
    try {
      await decide.mutateAsync({ id, status });
      toast.success(
        status === "accepted"
          ? "Proposition acceptée — commande créée."
          : "Proposition rejetée.",
      );
    } catch (e) {
      toast.error(errorMessage(e, "L'action a échoué."));
    }
  };

  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([requestId, group]) => (
        <Card key={requestId}>
          <CardHeader>
            <CardTitle className="text-base">
              <Link to={`/requests/${requestId}`} className="hover:text-primary hover:underline">
                {group.title}
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="-my-1">
            {group.items.map((p) => (
              <ProposalRow
                key={p.id}
                proposal={p}
                canDecide
                deciding={decide.isPending}
                onDecide={onDecide}
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function DashboardDoctor() {
  const user = useAuthStore((s) => s.user);
  const activate = useActivateWriter();
  const navigate = useNavigate();

  const becomeWriter = async () => {
    try {
      await activate.mutateAsync();
      toast.success("Mode rédacteur activé !");
      navigate("/onboarding");
    } catch (e) {
      toast.error(errorMessage(e, "L'activation a échoué."));
    }
  };

  return (
    <div className="container py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">Bon retour, {fullName(user)}.</p>
        </div>
        {!user?.is_writer && (
          <Button variant="outline" onClick={becomeWriter} disabled={activate.isPending}>
            {activate.isPending ? "Activation…" : "Devenir rédacteur aussi"}
          </Button>
        )}
      </div>
      <div className="mt-6">
        <Tabs
          tabs={[
            { key: "orders", label: "Mes commandes", render: () => <MyOrdersTab /> },
            { key: "requests", label: "Mes demandes", render: () => <MyRequestsTab /> },
            {
              key: "proposals",
              label: "Propositions reçues",
              render: () => <ProposalsReceivedTab />,
            },
          ]}
        />
      </div>
    </div>
  );
}
