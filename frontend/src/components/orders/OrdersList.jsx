import { Package } from "lucide-react";

import OrderCard from "@/components/orders/OrderCard";
import EmptyState from "@/components/feedback/EmptyState";
import ErrorState from "@/components/feedback/ErrorState";
import { LoadingBlock } from "@/components/feedback/Spinner";
import { useOrders } from "@/hooks/useOrders";

export default function OrdersList({ role, emptyTitle, emptyDescription, emptyAction }) {
  const { data, isLoading, isError, refetch } = useOrders({ role });

  if (isLoading) return <LoadingBlock />;
  if (isError) return <ErrorState onRetry={refetch} />;

  const orders = data?.results || [];
  if (orders.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} role={role} />
      ))}
    </div>
  );
}
