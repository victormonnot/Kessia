import { useQuery } from "@tanstack/react-query";

import { adminApi } from "@/api/admin";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";

export default function AdminAuditLog() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "audit-log"],
    queryFn: () => adminApi.auditLog(),
  });

  const rows = data?.results || [];

  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement…</p>;

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Admin</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Cible</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {formatDate(a.created_at)}
              </TableCell>
              <TableCell className="text-xs">{a.actor_email || "—"}</TableCell>
              <TableCell className="font-mono text-xs">{a.action}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {a.target_type} #{a.target_id}
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                Aucune action enregistrée.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
