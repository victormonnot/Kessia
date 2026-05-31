import { Link } from "react-router-dom";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import OrderRow from "@/components/orders/OrderRow";
import Tabs from "@/components/layout/Tabs";
import { useListings, useDeleteListing } from "@/hooks/useListings";
import { useOrders } from "@/hooks/useOrders";
import { useConnectStatus, useOnboard } from "@/hooks/usePayments";
import { useAuthStore } from "@/store/authStore";

function MyListingsTab() {
  const user = useAuthStore((s) => s.user);
  // Pas de filtre "mine" côté API pour l'instant — on récupère tout et on filtre côté client.
  const { data, isLoading } = useListings({ page_size: 100 });
  const remove = useDeleteListing();

  const mine = data?.results?.filter((l) => l.writer === user?.id) || [];

  if (isLoading) return <p className="text-neutral-500">Chargement…</p>;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Link to="/listings/new">
          <Button>+ Nouvelle annonce</Button>
        </Link>
      </div>
      {mine.length === 0 && (
        <Card>
          <p className="text-neutral-500">Vous n'avez pas encore publié d'annonces.</p>
        </Card>
      )}
      {mine.map((l) => (
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
  const { data, isLoading, isError } = useOrders();
  const user = useAuthStore((s) => s.user);

  if (isLoading) return <p className="text-neutral-500">Chargement…</p>;
  if (isError)
    return <p className="text-red-600">Impossible de charger les commandes.</p>;
  const orders = data?.results?.filter((o) => o.writer?.id === user?.id) || [];

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
  return (
    <Card>
      <p className="text-neutral-500">
        Ouvrez une demande depuis{" "}
        <Link to="/requests" className="text-primary-700 hover:underline">
          le tableau des demandes
        </Link>{" "}
        pour proposer vos services ou consulter vos propositions.
      </p>
    </Card>
  );
}

function PaymentsTab() {
  const { data, isLoading, isError } = useConnectStatus();
  const onboard = useOnboard();

  const startOnboarding = async () => {
    const { url } = await onboard.mutateAsync();
    window.location.href = url;
  };

  if (isLoading) return <p className="text-neutral-500">Chargement…</p>;
  if (isError)
    return <p className="text-red-600">Impossible de charger le statut des paiements.</p>;

  return (
    <Card className="space-y-3">
      <h2 className="font-medium text-neutral-900">Recevoir vos paiements</h2>
      {data?.payouts_enabled ? (
        <p className="text-green-700">
          Votre compte Stripe est configuré : vous pouvez recevoir le versement de vos commandes.
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
              : data?.has_account
                ? "Continuer la configuration"
                : "Configurer les paiements"}
          </Button>
        </>
      )}
    </Card>
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
            {
              key: "payments",
              label: "Paiements",
              render: () => <PaymentsTab />,
            },
          ]}
        />
      </div>
    </div>
  );
}
