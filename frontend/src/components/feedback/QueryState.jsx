import { LoadingBlock } from "@/components/feedback/Spinner";
import EmptyState from "@/components/feedback/EmptyState";
import ErrorState from "@/components/feedback/ErrorState";

// Declarative loading/error/empty wrapper for a TanStack Query result. Pass a
// custom `loading` node (e.g. a skeleton) or `empty` block per screen; sensible
// defaults are used otherwise. Children render only on the happy path.
export default function QueryState({
  isLoading,
  isError,
  isEmpty = false,
  onRetry,
  loading,
  error,
  empty,
  children,
}) {
  if (isLoading) return loading ?? <LoadingBlock />;
  if (isError) return error ?? <ErrorState onRetry={onRetry} />;
  if (isEmpty) return empty ?? <EmptyState title="Aucun résultat" />;
  return typeof children === "function" ? children() : children;
}
