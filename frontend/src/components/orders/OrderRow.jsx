import OrderActions from "@/components/orders/OrderActions";
import StatusBadge from "@/components/ui/StatusBadge";
import { PAYMENT_STATUS_LABELS } from "@/lib/choices";

function counterpartyName(order, role) {
  const u = role === "writer" ? order.doctor : order.writer;
  const name = `${u?.first_name || ""} ${u?.last_name || ""}`.trim();
  return name || (role === "writer" ? "Médecin" : "Rédacteur");
}

export default function OrderRow({ order, role }) {
  return (
    <tr className="border-b border-neutral-200 last:border-0">
      <td className="px-3 py-3 text-sm">
        <div className="font-medium text-neutral-900">
          {order.listing?.title || "Commande personnalisée"}
        </div>
        <div className="text-neutral-500">
          {Number(order.amount).toFixed(0)} {order.currency || "EUR"}
        </div>
      </td>
      <td className="px-3 py-3 text-sm text-neutral-600">
        {counterpartyName(order, role)}
      </td>
      <td className="px-3 py-3">
        <StatusBadge status={order.status} />
        {order.payment_status && order.payment_status !== "unpaid" && (
          <div className="mt-1 text-xs text-neutral-500">
            {PAYMENT_STATUS_LABELS[order.payment_status] || order.payment_status}
          </div>
        )}
      </td>
      <td className="px-3 py-3 text-right">
        <OrderActions order={order} role={role} />
      </td>
    </tr>
  );
}
