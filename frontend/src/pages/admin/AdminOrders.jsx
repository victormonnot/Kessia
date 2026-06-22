import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { adminApi } from "@/api/admin";
import { Button } from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import Modal from "@/components/ui/Modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { errorMessage, formatPrice } from "@/lib/format";

function OrderDetailModal({ orderId, onClose }) {
  const { data: order, isLoading } = useQuery({
    queryKey: ["admin", "order", orderId],
    queryFn: () => adminApi.order(orderId),
    enabled: Boolean(orderId),
  });
  return (
    <Modal open={Boolean(orderId)} onClose={onClose} title={`Commande #${orderId}`} description="Détail pour résolution de litige">
      {isLoading || !order ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : (
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Médecin</span>
            <span>{order.doctor_email}</span>
            <span className="text-muted-foreground">Rédacteur</span>
            <span>{order.writer_email}</span>
            <span className="text-muted-foreground">Montant</span>
            <span>{formatPrice(order.amount, order.currency)}</span>
            <span className="text-muted-foreground">Paiement</span>
            <span>{order.payment_status}</span>
          </div>
          <div>
            <p className="mb-1 font-medium">Livrables</p>
            {order.deliverables?.length ? (
              <ul className="list-inside list-disc text-muted-foreground">
                {order.deliverables.map((d) => (
                  <li key={d.id}>{d.filename}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">Aucun</p>
            )}
          </div>
          <div>
            <p className="mb-1 font-medium">Conversation</p>
            <div className="max-h-60 space-y-2 overflow-auto rounded-md border p-2">
              {order.messages?.length ? (
                order.messages.map((m, i) => (
                  <div key={i} className="text-xs">
                    <span className="font-medium">{m.sender}: </span>
                    <span className="text-muted-foreground">{m.body}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">Aucun message.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function AdminOrders() {
  const qc = useQueryClient();
  const [disputedOnly, setDisputedOnly] = useState(false);
  const [detailId, setDetailId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders", disputedOnly],
    queryFn: () => adminApi.orders(disputedOnly ? { disputed: "true" } : {}),
  });

  const action = useMutation({
    mutationFn: ({ fn, id }) => fn(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      toast.success("Action effectuée.");
    },
    onError: (e) => toast.error(errorMessage(e, "Action impossible.")),
  });

  const rows = data?.results || [];

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={disputedOnly}
          onChange={(e) => setDisputedOnly(e.target.checked)}
        />
        Litiges uniquement
      </label>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Parties</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.id}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {o.doctor_email}
                    <br />→ {o.writer_email}
                  </TableCell>
                  <TableCell>{formatPrice(o.amount, o.currency)}</TableCell>
                  <TableCell className="space-x-1">
                    <Badge variant="neutral">{o.status}</Badge>
                    <Badge variant={o.payment_status === "held" ? "info" : "neutral"}>
                      {o.payment_status}
                    </Badge>
                    {o.is_disputed && <Badge variant="danger">Litige</Badge>}
                  </TableCell>
                  <TableCell className="space-x-1 text-right">
                    <Button size="sm" variant="ghost" onClick={() => setDetailId(o.id)}>
                      Voir
                    </Button>
                    {o.payment_status === "held" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (window.confirm("Verser les fonds au rédacteur ?"))
                              action.mutate({ fn: adminApi.releaseOrder, id: o.id });
                          }}
                        >
                          Verser
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => {
                            if (window.confirm("Rembourser le médecin ?"))
                              action.mutate({ fn: adminApi.refundOrder, id: o.id });
                          }}
                        >
                          Rembourser
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    Aucune commande.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
      {detailId && <OrderDetailModal orderId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}
