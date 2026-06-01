import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingBlock } from "@/components/feedback/Spinner";
import ListingForm from "@/components/listings/ListingForm";
import { errorMessage } from "@/lib/format";
import { useCreateListing, useListing, useUpdateListing } from "@/hooks/useListings";

export default function ListingFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: existing, isLoading } = useListing(id);
  const create = useCreateListing();
  const update = useUpdateListing(id);
  const submitting = create.isPending || update.isPending;

  const onSubmit = async (payload) => {
    try {
      const saved = isEdit ? await update.mutateAsync(payload) : await create.mutateAsync(payload);
      toast.success(isEdit ? "Annonce mise à jour." : "Annonce publiée.");
      navigate(`/listings/${saved.id}`);
    } catch (err) {
      toast.error(errorMessage(err, "Échec de l'enregistrement de l'annonce."));
    }
  };

  return (
    <div className="container max-w-2xl py-8">
      <Link
        to={isEdit ? `/listings/${id}` : "/dashboard/writer"}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Retour
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {isEdit ? "Modifier l'annonce" : "Nouvelle annonce"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEdit && isLoading ? (
            <LoadingBlock />
          ) : (
            <ListingForm initial={existing} onSubmit={onSubmit} submitting={submitting} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
