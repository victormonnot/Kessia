import Badge from "./Badge";
import { STATUS_LABELS } from "@/lib/choices";

const statusToVariant = {
  pending: "warning",
  accepted: "success",
  delivered: "primary",
  declined: "danger",
  rejected: "danger",
  open: "primary",
  closed: "neutral",
};

export default function StatusBadge({ status }) {
  const variant = statusToVariant[status] || "neutral";
  return <Badge variant={variant}>{STATUS_LABELS[status] || status}</Badge>;
}
