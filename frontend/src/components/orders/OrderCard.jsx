import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StatusBadge from "@/components/ui/StatusBadge";
import OrderActions from "@/components/orders/OrderActions";
import { avatarFor } from "@/lib/demo-assets";
import { PAYMENT_STATUS_LABELS } from "@/lib/choices";
import { formatPrice, fullName, initials } from "@/lib/format";

export default function OrderCard({ order, role }) {
  const counterparty = role === "writer" ? order.doctor : order.writer;
  const paid = order.payment_status && order.payment_status !== "unpaid";

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <Avatar className="size-10">
            <AvatarImage src={counterparty?.avatar || avatarFor(fullName(counterparty))} alt="" />
            <AvatarFallback className="bg-secondary text-xs font-semibold text-foreground">
              {initials(counterparty)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{order.listing?.title || "Commande personnalisée"}</p>
            <p className="text-sm text-muted-foreground">
              {role === "writer" ? "Médecin" : "Rédacteur"} : {fullName(counterparty)} ·{" "}
              <span className="font-medium text-foreground">
                {formatPrice(order.amount, order.currency)}
              </span>
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={order.status} />
          {paid && (
            <span className="text-xs text-muted-foreground">
              {PAYMENT_STATUS_LABELS[order.payment_status] || order.payment_status}
            </span>
          )}
        </div>
      </div>
      <div className="mt-3 flex justify-end border-t pt-3">
        <OrderActions order={order} role={role} />
      </div>
    </div>
  );
}
