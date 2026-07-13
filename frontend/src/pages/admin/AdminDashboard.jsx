import { useQuery } from "@tanstack/react-query";

import { adminApi } from "@/api/admin";
import { Card, CardContent } from "@/components/ui/card";

const COUNT_TILES = [
  ["Utilisateurs", "users_total"],
  ["Rédacteurs", "writers_total"],
  ["Rédacteurs vérifiés", "verified_writers"],
  ["Comptes suspendus", "suspended_users"],
  ["Annonces", "listings_total"],
  ["Demandes ouvertes", "requests_open"],
  ["Commandes", "orders_total"],
  ["Commandes actives", "orders_active"],
];

function eur(value) {
  return Number(value || 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function Tile({ label, value }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["admin", "stats"], queryFn: adminApi.stats });

  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement…</p>;
  const s = data || {};

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {COUNT_TILES.map(([label, key]) => (
          <Tile key={key} label={label} value={s[key] ?? "—"} />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Volume (GMV)" value={eur(s.gmv)} />
        <Tile label="Revenu (commissions)" value={eur(s.revenue)} />
        <Tile label="Sous séquestre" value={eur(s.in_escrow)} />
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">À traiter</p>
            <p className="mt-2 text-sm leading-relaxed">
              {s.pending_verifications} vérification(s)
              <br />
              {s.open_disputes} litige(s)
              <br />
              {s.open_reports} signalement(s)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
