import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ChatPanel from "@/components/messaging/ChatPanel";
import { useConversation } from "@/hooks/useMessaging";
import { fullName, initials } from "@/lib/format";

export default function Conversation() {
  const { id } = useParams();
  const { data: conversation } = useConversation(id);
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
            <AvatarImage src={other?.avatar || undefined} alt="" />
            <AvatarFallback className="bg-secondary text-xs font-semibold text-foreground">
              {initials(other)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-semibold leading-tight">
              {other ? fullName(other) : "Conversation"}
            </p>
            {conversation?.order && (
              <Link
                to={`/commandes/${conversation.order}`}
                className="text-xs text-muted-foreground hover:text-primary hover:underline"
              >
                Commande #{conversation.order}
              </Link>
            )}
          </div>
        </div>

        {/* Chat */}
        <ChatPanel conversationId={id} />
      </div>
    </div>
  );
}
