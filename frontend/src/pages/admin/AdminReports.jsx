import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { adminApi } from "@/api/admin";
import ConfirmButton from "@/components/ConfirmButton";
import { Button } from "@/components/ui/button";
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

const STATUS_VARIANT = { open: "warning", resolved: "success", dismissed: "neutral" };

export default function AdminReports() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("open");
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "reports", status],
    queryFn: () => adminApi.reports(status ? { status } : {}),
  });

  const action = useMutation({
    mutationFn: ({ fn, id }) => fn(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reports"] });
      toast.success("Signalement traité.");
    },
    onError: (e) => toast.error(errorMessage(e, "Action impossible.")),
  });

  const rows = data?.results || [];

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {["open", "resolved", "dismissed", ""].map((s) => (
          <Button
            key={s || "all"}
            size="sm"
            variant={status === s ? "default" : "outline"}
            onClick={() => setStatus(s)}
          >
            {s === "open" ? "Ouverts" : s === "resolved" ? "Résolus" : s === "dismissed" ? "Rejetés" : "Tous"}
          </Button>
        ))}
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cible</TableHead>
                <TableHead>Motif</TableHead>
                <TableHead>Auteur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {r.target_type} #{r.target_id}
                  </TableCell>
                  <TableCell className="max-w-sm">
                    <span className="line-clamp-2 text-sm">{r.reason}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.reporter_email}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[r.status] || "neutral"}>{r.status}</Badge>
                  </TableCell>
                  <TableCell className="space-x-1 text-right">
                    {r.status === "open" && (
                      <>
                        <ConfirmButton
                          size="sm"
                          variant="outline"
                          title="Marquer ce signalement comme résolu ?"
                          confirmLabel="Résoudre"
                          onConfirm={() => action.mutate({ fn: adminApi.resolveReport, id: r.id })}
                        >
                          Résoudre
                        </ConfirmButton>
                        <ConfirmButton
                          size="sm"
                          variant="ghost"
                          title="Rejeter ce signalement ?"
                          confirmLabel="Rejeter"
                          onConfirm={() => action.mutate({ fn: adminApi.dismissReport, id: r.id })}
                        >
                          Rejeter
                        </ConfirmButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    Aucun signalement.
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
