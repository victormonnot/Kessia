import { Link } from "react-router-dom";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import OrderRow from "@/components/orders/OrderRow";
import Tabs from "@/components/layout/Tabs";
import { useListings, useDeleteListing } from "@/hooks/useListings";
import { useOrders, useEarnings } from "@/hooks/useOrders";
import { useAllProposals } from "@/hooks/useRequests";
import { useConnectStatus, useOnboard } from "@/hooks/usePayments";
import { useAuthStore } from "@/store/authStore";

function MyListingsTab() {
  const { data, isLoading, isError } = useListings({ mine: true });
  const remove = useDeleteListing();

  if (isLoading) return <p className="text-neutral-500">Chargement…</p>;
  if (isError) return <p className="text-red-600">Impossible de charger vos annonces.</p>;
  const listings = data?.results || [];

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Link to="/listings/new">
          <Button>+ Nouvelle annonce</Button>
        </Link>
      </div>
      {listings.length === 0 && (
        <Card>
          <p className="text-neutral-500">Vous n'avez pas encore publié d'annonces.</p>
        </Card>
      )}
      {listings.map((l) => (
        <Card key={l.id} className="flex items-center justify-between gap-3">
          <div>
            <Link to={`/listings/${l.id}`} className="font-medium text-neutral-900">
              {l.title}
            </Link>
            <p className="text-sm text-neutral-500">
              {Number(l.price).toFixed(0)} € · {l.specialty}
            </p>
          </div>
          <div className="flex gap-2">
            <Link to={`/listings/${l.id}/edit`}>
              <Button size="sm" variant="outline">
                Modifier
              </Button>
            </Link>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                if (confirm("Supprimer cette annonce ?")) remove.mutate(l.id);
              }}
            >
              Supprimer
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function OrdersReceivedTab() {
  const { data, isLoading, isError } = useOrders({ role: "writer" });
  if (isLoading) return <p className="text-neutral-500">Chargement…</p>;
  if (isError) return <p className="text-red-600">Impossible de charger les commandes.</p>;
  const orders = data?.results || [];

  return (
    <Card>
      {orders.length === 0 ? (
        <p className="text-neutral-500">Aucune commande reçue pour le moment.</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs uppercase text-neutral-500">
              <th className="px-3 py-2">Commande</th>
              <th className="px-3 py-2">Médecin</th>
              <th className="px-3 py-2">Statut</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <OrderRow key={o.id} order={o} role="writer" />
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

function MyProposalsTab() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError } = useAllProposals();
  if (isLoading) return <p className="text-neutral-500">Chargement…</p>;
  if (isError) return <p className="text-red-600">Impossible de charger vos propositions.</p>;

  const mine = (data?.results || []).filter((p) => p.writer?.id === user?.id);
  if (mine.length === 0) {
    return (
      <Card>
        <p className="text-neutral-500">
          Vous n'avez pas encore envoyé de proposition. Parcourez{" "}
          <Link to="/requests" className="text-primary-700 hover:underline">
            les demandes
          </Link>
          .
        </p>
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      {mine.map((p) => (
        <Card key={p.id} className="flex items-center justify-between gap-3">
          <div>
            <Link to={`/requests/${p.request}`} className="font-medium text-neutral-900">
              {p.request_title}
            </Link>
            <p className="text-sm text-neutral-500">{Number(p.price).toFixed(0)} €</p>
          </div>
          <StatusBadge status={p.status} />
        </Card>
      ))}
    </div>
  );
}

function PaymentsTab() {
  const { data: status, isLoading } = useConnectStatus();
  const { data: earnings } = useEarnings();
  const onboard = useOnboard();

  const startOnboarding = async () => {
    const { url } = await onboard.mutateAsync();
    window.location.href = url;
  };

  if (isLoading) return <p className="text-neutral-500">Chargement…</p>;

  return (
    <div className="space-y-4">
      <Card className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs uppercase text-neutral-500">En séquestre</p>
          <p className="text-xl font-semibold text-neutral-900">
            {Number(earnings?.in_escrow || 0).toFixed(2)} €
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-neutral-500">Gagné (net)</p>
          <p className="text-xl font-semibold text-neutral-900">
            {Number(earnings?.earned || 0).toFixed(2)} €
          </p>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-medium text-neutral-900">Recevoir vos paiements</h2>
        {status?.payouts_enabled ? (
          <p className="text-green-700">
            Votre compte Stripe est configuré : vous pouvez recevoir le versement de vos
            commandes.
          </p>
        ) : (
          <>
            <p className="text-neutral-600">
              Configurez votre compte de paiement Stripe pour recevoir le versement de vos
              commandes (commission plateforme de 15 % déduite, versement à la finalisation).
            </p>
            <Button onClick={startOnboarding} disabled={onboard.isPending}>
              {onboard.isPending
                ? "Redirection…"
                : status?.has_account
                  ? "Continuer la configuration"
                  : "Configurer les paiements"}
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}

export default function DashboardWriter() {
  const user = useAuthStore((s) => s.user);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-neutral-900">Tableau de bord rédacteur</h1>
      <p className="text-neutral-600">
        Bon retour, {user?.first_name || user?.email}.{" "}
        <Badge variant="primary">Rédacteur</Badge>
      </p>
      <div className="mt-6">
        <Tabs
          tabs={[
            { key: "listings", label: "Mes annonces", render: () => <MyListingsTab /> },
            {
              key: "orders",
              label: "Commandes reçues",
              render: () => <OrdersReceivedTab />,
            },
            {
              key: "proposals",
              label: "Mes propositions",
              render: () => <MyProposalsTab />,
            },
            { key: "payments", label: "Paiements", render: () => <PaymentsTab /> },
          ]}
        />
      </div>
    </div>
  );
}
