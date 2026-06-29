import { useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, FileText, Package, Paperclip } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import StatusBadge from "@/components/ui/StatusBadge";
import QueryState from "@/components/feedback/QueryState";
import { LoadingBlock } from "@/components/feedback/Spinner";
import ChatPanel from "@/components/messaging/ChatPanel";
import OrderActions from "@/components/orders/OrderActions";
import OrderStepper from "@/components/orders/OrderStepper";
import OrderTimeline from "@/components/orders/OrderTimeline";
import { ordersApi } from "@/api/orders";
import { useOrder, useOrderConversation, useUploadOrderAttachment } from "@/hooks/useOrders";
import { useAuthStore } from "@/store/authStore";
import { PAYMENT_STATUS_LABELS } from "@/lib/choices";
import { errorMessage, formatDateTime, formatPrice, fullName, initials } from "@/lib/format";

const CLOSED_STATUSES = ["completed", "cancelled", "declined"];

function roleFor(order, me) {
  if (!order || !me) return null;
  if (order.writer?.id === me.id) return "writer";
  if (order.doctor?.id === me.id) return "doctor";
  return null;
}

function uploaderLabel(attachment, order) {
  const uid = attachment.uploaded_by?.id;
  if (uid === order.doctor?.id) return "Médecin";
  if (uid === order.writer?.id) return "Rédacteur";
  return fullName(attachment.uploaded_by);
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "fichier";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function OrderWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const orderQuery = useOrder(id);
  const { data: conversation } = useOrderConversation(id);
  const uploadAttachment = useUploadOrderAttachment(id);
  const attachInputRef = useRef(null);
  const order = orderQuery.data;

  const downloadDeliverable = async (deliverable) => {
    try {
      const blob = await ordersApi.downloadDeliverable(order.id, deliverable.id);
      triggerDownload(blob, deliverable.filename || "livrable");
    } catch (e) {
      toast.error(errorMessage(e, "Le téléchargement a échoué."));
    }
  };

  const downloadAttachment = async (attachment) => {
    try {
      const blob = await ordersApi.downloadAttachment(order.id, attachment.id);
      triggerDownload(blob, attachment.filename || "document");
    } catch (e) {
      toast.error(errorMessage(e, "Le téléchargement a échoué."));
    }
  };

  const onPickAttachment = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      await uploadAttachment.mutateAsync(formData);
      toast.success("Document ajouté.");
    } catch (err) {
      toast.error(errorMessage(err, "L'envoi du document a échoué."));
    }
  };

  return (
    <div className="container py-8">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="size-4" /> Retour
      </Button>

      <QueryState
        isLoading={orderQuery.isLoading}
        isError={orderQuery.isError}
        onRetry={orderQuery.refetch}
      >
        {() => {
          const role = roleFor(order, me);
          const counterparty = role === "writer" ? order.doctor : order.writer;
          const title = order.listing?.title || "Commande personnalisée";
          const canDownload =
            role === "writer" || ["delivered", "completed"].includes(order.status);
          const canAttach = Boolean(role) && !CLOSED_STATUSES.includes(order.status);
          const attachments = order.attachments || [];

          return (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Main column */}
              <div className="space-y-6 lg:col-span-2">
                <Card>
                  <CardHeader className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Commande #{order.id}</p>
                        <CardTitle className="mt-1 text-xl">{title}</CardTitle>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                    <OrderStepper status={order.status} />
                  </CardHeader>
                </Card>

                {/* Brief & source documents */}
                <Card>
                  <CardHeader className="flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-base">Brief &amp; documents de la demande</CardTitle>
                    {canAttach && (
                      <>
                        <input
                          ref={attachInputRef}
                          type="file"
                          className="hidden"
                          onChange={onPickAttachment}
                          aria-hidden="true"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={uploadAttachment.isPending}
                          onClick={() => attachInputRef.current?.click()}
                        >
                          <Paperclip className="size-4" /> Ajouter un document
                        </Button>
                      </>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {order.message ? (
                      <p className="whitespace-pre-line text-sm text-foreground">{order.message}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Aucune consigne n'a été fournie à la commande.
                      </p>
                    )}

                    {attachments.length > 0 && (
                      <ul className="space-y-2">
                        {attachments.map((a) => (
                          <li
                            key={a.id}
                            className="flex items-center gap-3 rounded-lg border p-3 text-sm"
                          >
                            <FileText className="size-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">{a.filename}</p>
                              <p className="text-xs text-muted-foreground">
                                {uploaderLabel(a, order)} · {formatDateTime(a.uploaded_at)}
                                {a.note ? ` · ${a.note}` : ""}
                              </p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => downloadAttachment(a)}>
                              <Download className="size-4" /> Télécharger
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>

                {/* Chat */}
                <Card className="overflow-hidden">
                  <CardHeader className="border-b">
                    <CardTitle className="text-base">Échanges</CardTitle>
                  </CardHeader>
                  {conversation?.id ? (
                    <div className="h-[32rem]">
                      <ChatPanel conversationId={String(conversation.id)} />
                    </div>
                  ) : (
                    <div className="p-6">
                      <LoadingBlock />
                    </div>
                  )}
                </Card>

                {/* Deliverables */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Livraisons</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {order.deliverables?.length ? (
                      <ul className="space-y-2">
                        {order.deliverables.map((d) => (
                          <li
                            key={d.id}
                            className="flex items-center gap-3 rounded-lg border p-3 text-sm"
                          >
                            <FileText className="size-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">{d.filename}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDateTime(d.uploaded_at)}
                                {d.note ? ` · ${d.note}` : ""}
                              </p>
                            </div>
                            {canDownload && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadDeliverable(d)}
                              >
                                <Download className="size-4" /> Télécharger
                              </Button>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="size-4" />
                        Aucun livrable pour le moment.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Résumé</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarImage src={counterparty?.avatar || undefined} alt="" />
                        <AvatarFallback className="bg-secondary text-xs font-semibold text-foreground">
                          {initials(counterparty)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                          {role === "writer" ? "Médecin" : "Rédacteur"}
                        </p>
                        {role === "writer" ? (
                          <p className="truncate font-medium">{fullName(counterparty)}</p>
                        ) : (
                          <Link
                            to={`/redacteurs/${counterparty?.id}`}
                            className="truncate font-medium hover:text-primary hover:underline"
                          >
                            {fullName(counterparty)}
                          </Link>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <Row label="Montant">
                      <span className="font-semibold">
                        {formatPrice(order.amount, order.currency)}
                      </span>
                    </Row>
                    <Row label="Paiement">
                      {PAYMENT_STATUS_LABELS[order.payment_status] || order.payment_status}
                    </Row>
                    <Row label="Créée le">{formatDateTime(order.created_at)}</Row>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {role ? (
                      <OrderActions order={order} role={role} hideContact />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Vous n'êtes pas partie à cette commande.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Activité</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <OrderTimeline events={order.events || []} />
                  </CardContent>
                </Card>
              </div>
            </div>
          );
        }}
      </QueryState>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}
