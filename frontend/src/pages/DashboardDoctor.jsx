import { Link } from "react-router-dom";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import OrderRow from "@/components/orders/OrderRow";
import Tabs from "@/components/layout/Tabs";
import { useOrders } from "@/hooks/useOrders";
import { useRequests } from "@/hooks/useRequests";
import { useActivateWriter } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";

function MyOrdersTab() {
  const { data, isLoading } = useOrders();
  const user = useAuthStore((s) => s.user);
  if (isLoading) return <p className="text-neutral-500">Chargement…</p>;
  const orders = data?.results?.filter((o) => o.doctor?.id === user?.id) || [];
  if (orders.length === 0) {
    return (
      <Card>
        <p className="text-neutral-500">
          Parcourez les{" "}
          <Link to="/listings" className="text-primary-700">
            annonces
          </Link>{" "}
          pour passer votre première commande.
        </p>
      </Card>
    );
  }
  return (
    <Card>
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs uppercase text-neutral-500">
            <th className="px-3 py-2">Annonce</th>
            <th className="px-3 py-2">Rédacteur</th>
            <th className="px-3 py-2">Statut</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <OrderRow key={o.id} order={o} role="doctor" />
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function MyRequestsTab() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useRequests({ page_size: 100 });
  if (isLoading) return <p className="text-neutral-500">Chargement…</p>;
  const mine = data?.results?.filter((r) => r.doctor?.id === user?.id) || [];
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Link to="/requests/new">
          <Button>+ Nouvelle demande</Button>
        </Link>
      </div>
      {mine.length === 0 && (
        <Card>
          <p className="text-neutral-500">Vous n'avez pas encore publié de demandes.</p>
        </Card>
      )}
      {mine.map((r) => (
        <Card key={r.id} className="flex items-center justify-between">
          <div>
            <Link to={`/requests/${r.id}`} className="font-medium text-neutral-900">
              {r.title}
            </Link>
            <p className="text-sm text-neutral-500">
              {r.specialty} · échéance {r.deadline} · {r.proposals_count ?? 0} propositions
            </p>
          </div>
          <StatusBadge status={r.status} />
        </Card>
      ))}
    </div>
  );
}

function ProposalsReceivedTab() {
  return (
    <Card>
      <p className="text-neutral-500">
        Ouvrez l'une de vos demandes pour consulter les propositions reçues.
      </p>
    </Card>
  );
}

export default function DashboardDoctor() {
  const user = useAuthStore((s) => s.user);
  const activate = useActivateWriter();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Tableau de bord médecin</h1>
          <p className="text-neutral-600">
            Bon retour, {user?.first_name || user?.email}.
          </p>
        </div>
        {!user?.is_writer && (
          <Button
            variant="outline"
            onClick={() => activate.mutate()}
            disabled={activate.isPending}
          >
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
