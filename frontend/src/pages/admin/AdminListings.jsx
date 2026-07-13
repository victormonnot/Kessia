import { useState } from "react";
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
import { errorMessage, formatPrice } from "@/lib/format";

export default function AdminListings() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "listings", search],
    queryFn: () => adminApi.listings({ search }),
  });

  const action = useMutation({
    mutationFn: ({ fn, id }) => fn(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "listings"] });
      toast.success("Action effectuée.");
    },
    onError: (e) => toast.error(errorMessage(e, "Action impossible.")),
  });

  const rows = data?.results || [];

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher par titre ou rédacteur…"
        className="w-full max-w-sm rounded-md border bg-background px-3 py-2 text-sm"
      />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Annonce</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <div className="font-medium">{l.title}</div>
                    <div className="text-xs text-muted-foreground">{l.writer_email}</div>
                  </TableCell>
                  <TableCell>{formatPrice(l.price)}</TableCell>
                  <TableCell>
                    {l.is_removed ? (
                      <Badge variant="danger">Retirée</Badge>
                    ) : l.is_published ? (
                      <Badge variant="success">Publiée</Badge>
                    ) : (
                      <Badge variant="neutral">Brouillon</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {l.is_removed ? (
                      <ConfirmButton
                        size="sm"
                        variant="outline"
                        title="Restaurer cette annonce ?"
                        description={`« ${l.title} » sera de nouveau visible sur le site.`}
                        confirmLabel="Restaurer"
                        onConfirm={() => action.mutate({ fn: adminApi.restoreListing, id: l.id })}
                      >
                        Restaurer
                      </ConfirmButton>
                    ) : (
                      <ConfirmButton
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        destructive
                        title="Retirer cette annonce ?"
                        description={`« ${l.title} » sera retirée du site.`}
                        confirmLabel="Retirer"
                        onConfirm={() => action.mutate({ fn: adminApi.removeListing, id: l.id })}
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
                    Aucune annonce.
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
