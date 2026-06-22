import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { adminApi } from "@/api/admin";
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

export default function AdminUsers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", search],
    queryFn: () => adminApi.users({ search }),
  });

  const action = useMutation({
    mutationFn: ({ fn, id }) => fn(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Action effectuée.");
    },
    onError: (e) => toast.error(errorMessage(e, "Action impossible.")),
  });

  const run = (fn, id, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    action.mutate({ fn, id });
  };

  const users = data?.results || [];

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher par e-mail ou nom…"
        className="w-full max-w-sm rounded-md border bg-background px-3 py-2 text-sm"
      />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium">{u.full_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{u.is_writer ? "Rédacteur" : "Médecin"}</Badge>
                    {u.is_verified && <Badge variant="success">Vérifié</Badge>}
                    {u.is_staff && <Badge variant="warning">Admin</Badge>}
                  </TableCell>
                  <TableCell>
                    {u.is_deleted ? (
                      <Badge variant="neutral">Supprimé</Badge>
                    ) : u.is_suspended ? (
                      <Badge variant="danger">Suspendu</Badge>
                    ) : (
                      <Badge variant="success">Actif</Badge>
                    )}
                  </TableCell>
                  <TableCell className="space-x-1 text-right">
                    {!u.is_deleted &&
                      (u.is_suspended ? (
                        <Button size="sm" variant="outline" onClick={() => run(adminApi.unsuspendUser, u.id)}>
                          Réactiver
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => run(adminApi.suspendUser, u.id, `Suspendre ${u.email} ?`)}
                        >
                          Suspendre
                        </Button>
                      ))}
                    {u.is_writer &&
                      (u.is_verified ? (
                        <Button size="sm" variant="ghost" onClick={() => run(adminApi.unverifyUser, u.id)}>
                          Retirer badge
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => run(adminApi.verifyUser, u.id)}>
                          Vérifier
                        </Button>
                      ))}
                    {!u.is_deleted && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() =>
                          run(
                            adminApi.anonymizeUser,
                            u.id,
                            `Anonymiser définitivement ${u.email} (RGPD) ? Action irréversible.`,
                          )
                        }
                      >
                        Anonymiser
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    Aucun utilisateur.
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
