import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";

export default function OrderRow({ order, role, onAction }) {
  const transitions = {
    writer: {
      pending: [
        { label: "Accepter", next: "accepted", variant: "primary" },
        { label: "Refuser", next: "declined", variant: "outline" },
      ],
      accepted: [
        { label: "Marquer livrée", next: "delivered", variant: "primary" },
      ],
    },
  };

  const actions = transitions[role]?.[order.status] || [];

  return (
    <tr className="border-b border-neutral-200 last:border-0">
      <td className="px-3 py-3 text-sm font-medium text-neutral-900">
        {order.listing?.title}
      </td>
      <td className="px-3 py-3 text-sm text-neutral-600">
        {role === "writer"
          ? `${order.doctor?.first_name || ""} ${order.doctor?.last_name || ""}`.trim() ||
            "Médecin"
          : order.listing?.writer_name}
      </td>
      <td className="px-3 py-3">
        <StatusBadge status={order.status} />
      </td>
      <td className="px-3 py-3 text-right">
        <div className="flex justify-end gap-2">
          {actions.map((a) => (
            <Button
              key={a.next}
              size="sm"
              variant={a.variant}
              onClick={() => onAction?.(order.id, a.next)}
            >
              {a.label}
            </Button>
          ))}
        </div>
      </td>
    </tr>
  );
}
