import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import Badge from "@/components/ui/Badge";
import StatusBadge from "@/components/ui/StatusBadge";
import Tabs from "@/components/layout/Tabs";
import ConfirmButton from "@/components/ConfirmButton";
import EmptyState from "@/components/feedback/EmptyState";
import ErrorState from "@/components/feedback/ErrorState";
import { LoadingBlock } from "@/components/feedback/Spinner";
import OrdersList from "@/components/orders/OrdersList";
import EarningsSummary from "@/components/dashboard/EarningsSummary";
import ConnectCard from "@/components/payments/ConnectCard";
import VerificationCard from "@/components/verification/VerificationCard";
import { useDeleteListing, useListings } from "@/hooks/useListings";
import { useAllProposals } from "@/hooks/useRequests";
import { useAuthStore } from "@/store/authStore";
import { errorMessage, formatPrice, fullName } from "@/lib/format";
import { SPECIALTY_OPTIONS, labelFor } from "@/lib/choices";

function MyListingsTab() {
  const { data, isLoading, isError, isFetching, refetch } = useListings({ mine: true });
  const remove = useDeleteListing();

  if (isLoading || (isError && isFetching)) return <LoadingBlock />;
  if (isError) return <ErrorState onRetry={refetch} />;
  const listings = data?.results || [];

  const onDelete = async (id) => {
    try {
      await remove.mutateAsync(id);
      toast.success("Annonce supprimée.");
    } catch (e) {
      toast.error(errorMessage(e, "La suppression a échoué."));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link to="/listings/new">
            <Plus className="size-4" /> Nouvelle annonce
          </Link>
        </Button>
      </div>
      {listings.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucune annonce"
          description="Publiez votre première annonce pour recevoir des commandes."
          action={
            <Button asChild>
              <Link to="/listings/new">Publier une annonce</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <div
              key={l.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4 shadow-sm"
            >
              <div>
                <Link to={`/listings/${l.id}`} className="font-medium hover:text-primary">
                  {l.title}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {formatPrice(l.price)} · {labelFor(l.specialty, SPECIALTY_OPTIONS)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link to={`/listings/${l.id}/edit`}>
                    <Pencil className="size-4" /> Modifier
                  </Link>
                </Button>
                <ConfirmButton
                  size="sm"
                  variant="outline"
                  destructive
                  title="Supprimer cette annonce ?"
                  description="Cette action est définitive."
                  confirmLabel="Supprimer"
                  onConfirm={() => onDelete(l.id)}
                >
                  <Trash2 className="size-4" /> Supprimer
                </ConfirmButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OrdersReceivedTab() {
  return (
    <OrdersList
      role="writer"
      emptyTitle="Aucune commande reçue"
      emptyDescription="Les commandes passées sur vos annonces apparaîtront ici."
    />
  );
}

function MyProposalsTab() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, isFetching, refetch } = useAllProposals();
  if (isLoading || (isError && isFetching)) return <LoadingBlock />;
  if (isError) return <ErrorState onRetry={refetch} />;

  const mine = (data?.results || []).filter((p) => p.writer?.id === user?.id);
  if (mine.length === 0) {
    return (
      <EmptyState
        icon={Send}
        title="Aucune proposition"
        description="Parcourez les demandes et envoyez votre première proposition."
        action={
          <Button asChild>
            <Link to="/requests">Voir les demandes</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {mine.map((p) => (
        <div
          key={p.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4 shadow-sm"
        >
          <div>
            <Link to={`/requests/${p.request}`} className="font-medium hover:text-primary">
              {p.request_title}
            </Link>
            <p className="text-sm text-muted-foreground">{formatPrice(p.price)}</p>
          </div>
          <StatusBadge status={p.status} />
        </div>
      ))}
    </div>
  );
}

export default function DashboardWriter() {
  const user = useAuthStore((s) => s.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Stripe Connect redirects back here with ?stripe=return|refresh.
  useEffect(() => {
    const stripe = searchParams.get("stripe");
    if (!stripe) return;
    if (stripe === "return") {
      toast.success("Configuration Stripe enregistrée.");
      queryClient.invalidateQueries({ queryKey: ["connectStatus"] });
    } else if (stripe === "refresh") {
      toast.info("Reprenez la configuration de votre compte Stripe.");
    }
    const next = new URLSearchParams(searchParams);
    next.delete("stripe");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, queryClient]);

  return (
    <div className="container py-8">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
        <Badge variant="primary">Rédacteur</Badge>
        {user?.is_verified && <Badge variant="success">Vérifié</Badge>}
      </div>
      <p className="mt-1 text-muted-foreground">Bon retour, {fullName(user)}.</p>

      <div className="mt-6">
        <EarningsSummary />
      </div>

      <div className="mt-6">
        <Tabs
          tabs={[
            { key: "listings", label: "Mes annonces", render: () => <MyListingsTab /> },
            { key: "orders", label: "Commandes reçues", render: () => <OrdersReceivedTab /> },
            { key: "proposals", label: "Mes propositions", render: () => <MyProposalsTab /> },
            { key: "payments", label: "Paiements", render: () => <ConnectCard /> },
            { key: "verification", label: "Vérification", render: () => <VerificationCard /> },
          ]}
        />
      </div>
    </div>
  );
}
