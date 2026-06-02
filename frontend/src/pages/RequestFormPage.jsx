import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingBlock } from "@/components/feedback/Spinner";
import RequestForm from "@/components/requests/RequestForm";
import { errorMessage } from "@/lib/format";
import { useCreateRequest, useRequest, useUpdateRequest } from "@/hooks/useRequests";

export default function RequestFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: existing, isLoading } = useRequest(id);
  const create = useCreateRequest();
  const update = useUpdateRequest(id);
  const submitting = create.isPending || update.isPending;

  const onSubmit = async (payload) => {
    try {
      const saved = isEdit ? await update.mutateAsync(payload) : await create.mutateAsync(payload);
      toast.success(isEdit ? "Demande mise à jour." : "Demande publiée.");
      navigate(`/requests/${saved.id}`);
    } catch (err) {
      toast.error(errorMessage(err, "Échec de l'enregistrement de la demande."));
    }
  };

  return (
    <div className="container max-w-2xl py-8">
      <Link
        to={isEdit ? `/requests/${id}` : "/requests"}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Retour
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {isEdit ? "Modifier la demande" : "Publier une demande"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEdit && isLoading ? (
            <LoadingBlock />
          ) : (
            <RequestForm initial={existing} onSubmit={onSubmit} submitting={submitting} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
