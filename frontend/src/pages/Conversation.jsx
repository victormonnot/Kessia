import { useState } from "react";
import { useParams } from "react-router-dom";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useConversation, useMessages, useSendMessage } from "@/hooks/useMessaging";
import { useAuthStore } from "@/store/authStore";

export default function Conversation() {
  const { id } = useParams();
  const me = useAuthStore((s) => s.user);
  const { data: conversation } = useConversation(id);
  const { data: messages = [], isLoading, isError } = useMessages(id);
  const send = useSendMessage(id);
  const [body, setBody] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    await send.mutateAsync(text);
    setBody("");
  };

  const u = conversation?.other_user;
  const otherName =
    `${u?.first_name || ""} ${u?.last_name || ""}`.trim() || "Conversation";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-4 text-xl font-semibold text-neutral-900">
        {otherName}
        {conversation?.order ? ` · commande #${conversation.order}` : ""}
      </h1>

      <Card className="mb-4 flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
        {isLoading && <p className="text-neutral-500">Chargement…</p>}
        {isError && <p className="text-red-600">Impossible de charger la conversation.</p>}
        {!isLoading && messages.length === 0 && (
          <p className="text-neutral-500">Démarrez la conversation.</p>
        )}
        {messages.map((m) => {
          const mine = m.sender?.id === me?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                  mine ? "bg-primary-600 text-white" : "bg-neutral-100 text-neutral-900"
                }`}
              >
                <p className="whitespace-pre-line">{m.body}</p>
              </div>
            </div>
          );
        })}
      </Card>

      <form onSubmit={submit} className="flex gap-2">
        <textarea
          rows={2}
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          placeholder="Votre message…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <Button type="submit" disabled={send.isPending}>
          {send.isPending ? "…" : "Envoyer"}
        </Button>
      </form>
    </div>
  );
}
