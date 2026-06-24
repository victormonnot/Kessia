import { useState } from "react";
import { Link } from "react-router-dom";
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    {u.is_writer ? (
                      <Link
                        to={`/redacteurs/${u.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {u.full_name || u.email}
                      </Link>
                    ) : (
                      <span className="font-medium">{u.full_name || "—"}</span>
                    )}
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </TableCell>
                  <TableCell className="space-x-1">
                    <Badge variant="neutral">{u.is_writer ? "Rédacteur" : "Médecin"}</Badge>
                    {u.is_verified && <Badge variant="success">Vérifié</Badge>}
                    {u.is_staff && <Badge variant="warning">Admin</Badge>}
                  </TableCell>
                  <TableCell className="space-x-1 text-right">
                    {u.is_writer &&
                      (u.is_verified ? (
                        <ConfirmButton
                          size="sm"
                          variant="ghost"
                          title="Retirer le badge vérifié ?"
                          description={`Le badge « Vérifié » de ${u.email} sera retiré.`}
                          confirmLabel="Retirer"
                          onConfirm={() => action.mutate({ fn: adminApi.unverifyUser, id: u.id })}
                        >
                          Retirer badge
                        </ConfirmButton>
                      ) : (
                        <ConfirmButton
                          size="sm"
                          variant="ghost"
                          title="Vérifier ce rédacteur ?"
                          description={`Le badge « Vérifié » sera accordé à ${u.email}.`}
                          confirmLabel="Vérifier"
                          onConfirm={() => action.mutate({ fn: adminApi.verifyUser, id: u.id })}
                        >
                          Vérifier
                        </ConfirmButton>
                      ))}
                    <ConfirmButton
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      destructive
                      title="Supprimer ce compte ?"
                      description={`Les données personnelles de ${u.email} seront effacées (action irréversible). L'historique des commandes et les avis sont conservés. La suppression est refusée si une commande est en cours ou si des fonds ne sont pas réglés.`}
                      confirmLabel="Supprimer"
                      onConfirm={() => action.mutate({ fn: adminApi.deleteUser, id: u.id })}
                    >
                      Supprimer
                    </ConfirmButton>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
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
