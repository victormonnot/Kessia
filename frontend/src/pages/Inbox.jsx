import { useState } from "react";
import { Link } from "react-router-dom";
import { MessagesSquare, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/feedback/EmptyState";
import ErrorState from "@/components/feedback/ErrorState";
import { cn } from "@/lib/utils";
import { formatRelative, fullName, initials } from "@/lib/format";
import { useConversations } from "@/hooks/useMessaging";

export default function Inbox() {
  const { data, isLoading, isError, isFetching, refetch } = useConversations();
  const [query, setQuery] = useState("");

  const conversations = data?.results || [];
  const filtered = query
    ? conversations.filter((c) =>
        fullName(c.other_user).toLowerCase().includes(query.toLowerCase()),
      )
    : conversations;

  return (
    <div className="container max-w-3xl py-8">
      <h1 className="text-2xl font-bold tracking-tight">Messagerie</h1>

      {isError && !isFetching ? (
        <ErrorState className="mt-6" title="Impossible de charger vos messages" onRetry={refetch} />
      ) : isLoading || isError ? (
        <div className="mt-6 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[4.5rem] w-full rounded-lg" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={MessagesSquare}
          title="Aucune conversation"
          description="Vos échanges avec les médecins et rédacteurs apparaîtront ici."
          action={
            <Button asChild>
              <Link to="/listings">Parcourir les annonces</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="relative mt-6">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une conversation…"
              aria-label="Rechercher une conversation"
              className="pl-9"
            />
          </div>

          <div className="mt-4 space-y-2">
            {filtered.map((c) => {
              const unread = c.unread_count > 0;
              return (
                <Link
                  key={c.id}
                  to={`/messages/${c.id}`}
                  className="flex items-center gap-3 rounded-lg border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
                >
                  <Avatar className="size-11">
                    <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                      {initials(c.other_user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("truncate", unread ? "font-semibold" : "font-medium")}>
                        {fullName(c.other_user)}
                        {c.order ? (
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            · cmd #{c.order}
                          </span>
                        ) : null}
                      </p>
                      {c.last_message?.created_at && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatRelative(c.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    <p
                      className={cn(
                        "truncate text-sm",
                        unread ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {c.last_message?.body || "Nouvelle conversation"}
                    </p>
                  </div>
                  {unread && (
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                      {c.unread_count}
                    </span>
                  )}
                </Link>
              );
            })}
            {filtered.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucune conversation ne correspond.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
