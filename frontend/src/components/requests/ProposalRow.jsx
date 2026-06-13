import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatPrice, fullName, initials } from "@/lib/format";

export default function ProposalRow({ proposal, canDecide, onDecide, deciding }) {
  const pending = proposal.status === "pending";

  return (
    <div className="flex flex-col gap-3 border-b py-4 last:border-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex gap-3">
        <Avatar className="size-9">
          <AvatarFallback className="bg-secondary text-xs font-semibold text-foreground">
            {initials(proposal.writer)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {fullName(proposal.writer)}
            <span className="font-normal text-muted-foreground">
              {" · "}
              {formatPrice(proposal.price)}
            </span>
          </p>
          <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
            {proposal.message}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
        <StatusBadge status={proposal.status} />
        {canDecide && pending && (
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" disabled={deciding}>
                  Accepter
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Accepter cette proposition ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Une commande sera créée avec {fullName(proposal.writer)} pour{" "}
                    {formatPrice(proposal.price)}, et la demande sera fermée aux autres
                    propositions.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDecide(proposal.id, "accepted")}>
                    Accepter
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              size="sm"
              variant="outline"
              disabled={deciding}
              onClick={() => onDecide(proposal.id, "rejected")}
            >
              Rejeter
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
