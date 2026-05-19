import { useNavigate, useParams } from "react-router-dom";

import Card from "@/components/ui/Card";
import ListingForm from "@/components/listings/ListingForm";
import {
  useCreateListing,
  useListing,
  useUpdateListing,
} from "@/hooks/useListings";

export default function ListingFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: existing, isLoading } = useListing(id);
  const create = useCreateListing();
  const update = useUpdateListing(id);

  const submitting = create.isPending || update.isPending;

  const onSubmit = async (payload) => {
    if (isEdit) {
      const updated = await update.mutateAsync(payload);
      navigate(`/listings/${updated.id}`);
    } else {
      const created = await create.mutateAsync(payload);
      navigate(`/listings/${created.id}`);
    }
  };

  if (isEdit && isLoading) {
    return <p className="px-4 py-8 text-neutral-500">Chargement…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <h1 className="mb-6 text-2xl font-semibold text-neutral-900">
          {isEdit ? "Modifier l'annonce" : "Nouvelle annonce"}
        </h1>
        <ListingForm
          initial={existing}
          onSubmit={onSubmit}
          submitting={submitting}
        />
      </Card>
    </div>
  );
}
