import { Lock, TrendingUp, Wallet } from "lucide-react";

import StatCard from "@/components/dashboard/StatCard";
import { useEarnings } from "@/hooks/useOrders";
import { formatPrice } from "@/lib/format";

export default function EarningsSummary() {
  const { data } = useEarnings();
  const escrow = Number(data?.in_escrow || 0);
  const earned = Number(data?.earned || 0);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard
        icon={Lock}
        label="En séquestre"
        value={formatPrice(escrow)}
        hint={`${data?.held_count ?? 0} commande(s) en cours`}
      />
      <StatCard
        icon={TrendingUp}
        label="Gagné (net)"
        value={formatPrice(earned)}
        hint={`${data?.released_count ?? 0} commande(s) versée(s)`}
      />
      <StatCard icon={Wallet} label="Total" value={formatPrice(escrow + earned)} />
    </div>
  );
}
