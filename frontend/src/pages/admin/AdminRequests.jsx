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

export default function AdminRequests() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "requests", search],
    queryFn: () => adminApi.requests({ search }),
  });

  const action = useMutation({
    mutationFn: ({ fn, id }) => fn(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "requests"] });
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
        placeholder="Rechercher par titre ou médecin…"
        className="w-full max-w-sm rounded-md border bg-background px-3 py-2 text-sm"
      />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Demande</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{r.title}</div>
                    <div className="text-xs text-muted-foreground">{r.doctor_email}</div>
                  </TableCell>
                  <TableCell>{formatPrice(r.budget)}</TableCell>
                  <TableCell>
                    {r.is_removed ? (
                      <Badge variant="danger">Retirée</Badge>
                    ) : (
                      <Badge variant={r.status === "open" ? "info" : "neutral"}>
                        {r.status === "open" ? "Ouverte" : "Fermée"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {r.is_removed ? (
                      <ConfirmButton
                        size="sm"
                        variant="outline"
                        title="Restaurer cette demande ?"
                        description={`« ${r.title} » sera de nouveau visible sur le site.`}
                        confirmLabel="Restaurer"
                        onConfirm={() => action.mutate({ fn: adminApi.restoreRequest, id: r.id })}
                      >
                        Restaurer
                      </ConfirmButton>
                    ) : (
                      <ConfirmButton
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        destructive
                        title="Retirer cette demande ?"
                        description={`« ${r.title} » sera retirée du site.`}
                        confirmLabel="Retirer"
                        onConfirm={() => action.mutate({ fn: adminApi.removeRequest, id: r.id })}
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
                    Aucune demande.
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
