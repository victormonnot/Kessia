import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { adminApi } from "@/api/admin";
import ConfirmButton from "@/components/ConfirmButton";
import Badge from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { errorMessage } from "@/lib/format";

export default function AdminReviews() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: () => adminApi.reviews(),
  });

  const action = useMutation({
    mutationFn: ({ fn, id }) => fn(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
      toast.success("Action effectuée.");
    },
    onError: (e) => toast.error(errorMessage(e, "Action impossible.")),
  });

  const rows = data?.results || [];

  return (
    <div className="space-y-4">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Note</TableHead>
                <TableHead>Commentaire</TableHead>
                <TableHead>Rédacteur</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap font-medium">{r.rating} / 5</TableCell>
                  <TableCell className="max-w-md">
                    <span className="line-clamp-2 text-sm">{r.comment || "—"}</span>
                    {r.is_removed && <Badge variant="danger">Retiré</Badge>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.writer_email}</TableCell>
                  <TableCell className="text-right">
                    {r.is_removed ? (
                      <ConfirmButton
                        size="sm"
                        variant="outline"
                        title="Restaurer cet avis ?"
                        description="L'avis redeviendra visible et comptera de nouveau dans la note."
                        confirmLabel="Restaurer"
                        onConfirm={() => action.mutate({ fn: adminApi.restoreReview, id: r.id })}
                      >
                        Restaurer
                      </ConfirmButton>
                    ) : (
                      <ConfirmButton
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        destructive
                        title="Retirer cet avis ?"
                        description="L'avis sera masqué et exclu de la note du rédacteur."
                        confirmLabel="Retirer"
                        onConfirm={() => action.mutate({ fn: adminApi.removeReview, id: r.id })}
                      >
                        Retirer
                      </ConfirmButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    Aucun avis.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
