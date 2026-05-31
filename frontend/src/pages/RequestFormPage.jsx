import { useNavigate, useParams } from "react-router-dom";

import Card from "@/components/ui/Card";
import RequestForm from "@/components/requests/RequestForm";
import {
  useCreateRequest,
  useRequest,
  useUpdateRequest,
} from "@/hooks/useRequests";

export default function RequestFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: existing, isLoading } = useRequest(id);
  const create = useCreateRequest();
  const update = useUpdateRequest(id);

  const submitting = create.isPending || update.isPending;

  const onSubmit = async (payload) => {
    if (isEdit) {
      const updated = await update.mutateAsync(payload);
      navigate(`/requests/${updated.id}`);
    } else {
      const created = await create.mutateAsync(payload);
      navigate(`/requests/${created.id}`);
    }
  };

  if (isEdit && isLoading) {
    return <p className="px-4 py-8 text-neutral-500">Chargement…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <h1 className="mb-6 text-2xl font-semibold text-neutral-900">
          {isEdit ? "Modifier la demande" : "Publier une demande"}
        </h1>
        <RequestForm
          initial={existing}
          onSubmit={onSubmit}
          submitting={submitting}
        />
      </Card>
    </div>
  );
}
