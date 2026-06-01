import { Link } from "react-router-dom";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { useConversations } from "@/hooks/useMessaging";

function otherName(conversation) {
  const u = conversation.other_user;
  return `${u?.first_name || ""} ${u?.last_name || ""}`.trim() || "Utilisateur";
}

export default function Inbox() {
  const { data, isLoading, isError } = useConversations();

  if (isLoading)
    return <p className="mx-auto max-w-3xl px-4 py-8 text-neutral-500">Chargement…</p>;
  if (isError)
    return (
      <p className="mx-auto max-w-3xl px-4 py-8 text-red-600">
        Impossible de charger vos messages.
      </p>
    );

  const conversations = data?.results || [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold text-neutral-900">Messagerie</h1>
      {conversations.length === 0 ? (
        <Card>
          <p className="text-neutral-500">Aucune conversation pour le moment.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => (
            <Link key={c.id} to={`/messages/${c.id}`} className="block">
              <Card className="flex items-center justify-between gap-3 hover:border-primary-500">
                <div className="min-w-0">
                  <p className="font-medium text-neutral-900">
                    {otherName(c)}
                    {c.order ? ` · commande #${c.order}` : ""}
                  </p>
                  <p className="truncate text-sm text-neutral-500">
                    {c.last_message?.body || "Nouvelle conversation"}
                  </p>
                </div>
                {c.unread_count > 0 && <Badge variant="primary">{c.unread_count}</Badge>}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
