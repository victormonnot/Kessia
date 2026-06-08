import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Paperclip, Send, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import Spinner from "@/components/feedback/Spinner";
import { messagingApi } from "@/api/messaging";
import { useConversation, useMessages, useSendMessage } from "@/hooks/useMessaging";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { errorMessage, formatDateTime, fullName, initials } from "@/lib/format";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
const WS_BASE = API_BASE.replace(/^http/, "ws").replace(/\/api\/v1\/?$/, "");

function formatBytes(bytes) {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function Conversation() {
  const { id } = useParams();
  const me = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { data: conversation } = useConversation(id);
  const { data: messages = [], isLoading, isError } = useMessages(id);
  const send = useSendMessage(id);
  const [body, setBody] = useState("");
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);

  // Live delivery: a WebSocket pushes new messages instantly; the REST polling
  // in useMessages stays as a fallback. The access token is passed via the
  // connection subprotocol (never the URL). On a push we refetch the thread
  // (which also marks incoming messages read) and the inbox.
  useEffect(() => {
    const token = useAuthStore.getState().accessToken;
    if (!id || !token) return undefined;
    const ws = new WebSocket(`${WS_BASE}/ws/conversations/${id}/`, ["access_token", token]);
    ws.onmessage = () => {
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };
    return () => ws.close();
  }, [id, queryClient]);

  // Autoscroll to the latest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const submit = async (e) => {
    e?.preventDefault();
    const text = body.trim();
    if ((!text && !file) || send.isPending) return;
    const sentFile = file;
    setBody("");
    setFile(null);
    try {
      await send.mutateAsync({ body: text, attachment: sentFile });
    } catch (err) {
      setBody(text);
      setFile(sentFile);
      toast.error(errorMessage(err, "L'envoi du message a échoué."));
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(e);
    }
  };

  const onPickFile = (e) => {
    const picked = e.target.files?.[0];
    if (picked) setFile(picked);
    e.target.value = ""; // allow re-picking the same file
  };

  const downloadAttachment = async (m) => {
    try {
      const blob = await messagingApi.downloadAttachment(id, m.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = m.attachment_name || "piece-jointe";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(errorMessage(err, "Le téléchargement a échoué."));
    }
  };

  const other = conversation?.other_user;

  return (
    <div className="container max-w-3xl py-6">
      <div className="flex h-[72vh] flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 border-b p-4">
          <Button asChild variant="ghost" size="icon" className="md:hidden" aria-label="Retour">
            <Link to="/messages">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <Avatar className="size-10">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {initials(other)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-semibold leading-tight">
              {other ? fullName(other) : "Conversation"}
            </p>
            {conversation?.order && (
              <p className="text-xs text-muted-foreground">Commande #{conversation.order}</p>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="ml-auto h-10 w-1/2" />
              <Skeleton className="h-10 w-3/5" />
            </div>
          ) : isError ? (
            <p className="text-sm text-destructive">Impossible de charger la conversation.</p>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
              Démarrez la conversation.
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.sender?.id === me?.id;
              return (
                <div key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "max-w-[75%] space-y-1.5 rounded-2xl px-3.5 py-2 text-sm",
                      mine
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm bg-muted text-foreground",
                    )}
                  >
                    {m.body && <p className="whitespace-pre-line">{m.body}</p>}
                    {m.attachment_name && (
                      <button
                        type="button"
                        onClick={() => downloadAttachment(m)}
                        className={cn(
                          "flex max-w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs hover:underline",
                          mine ? "bg-primary-foreground/15" : "bg-background",
                        )}
                      >
                        <Paperclip className="size-3.5 shrink-0" />
                        <span className="truncate">{m.attachment_name}</span>
                        {m.attachment_size != null && (
                          <span className="shrink-0 opacity-70">
                            {formatBytes(m.attachment_size)}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                  <span className="mt-1 px-1 text-[11px] text-muted-foreground">
                    {formatDateTime(m.created_at)}
                  </span>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <form onSubmit={submit} className="border-t p-3">
          {file && (
            <div className="mb-2 flex items-center gap-2 rounded-md border bg-muted/40 px-2.5 py-1.5 text-xs">
              <Paperclip className="size-3.5 shrink-0" />
              <span className="flex-1 truncate">{file.name}</span>
              <span className="shrink-0 text-muted-foreground">{formatBytes(file.size)}</span>
              <button
                type="button"
                onClick={() => setFile(null)}
                aria-label="Retirer le fichier"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={onPickFile}
              aria-hidden="true"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Joindre un fichier"
            >
              <Paperclip className="size-4" />
            </Button>
            <textarea
              rows={1}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Votre message…"
              aria-label="Votre message"
              className="max-h-32 flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <Button
              type="submit"
              size="icon"
              disabled={send.isPending || (!body.trim() && !file)}
              aria-label="Envoyer"
            >
              {send.isPending ? <Spinner /> : <Send className="size-4" />}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
