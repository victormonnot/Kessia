import { Link } from "react-router-dom";
import { Check, CreditCard, FileText, ShieldCheck, UserCog } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useListings } from "@/hooks/useListings";
import { useConnectStatus } from "@/hooks/usePayments";
import { useMyVerifications } from "@/hooks/useVerification";

function Step({ done, icon: Icon, title, description, action }) {
  return (
    <div className="flex gap-4 rounded-lg border bg-card p-4 shadow-sm">
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          done ? "bg-emerald-100 text-emerald-700" : "bg-primary/10 text-primary",
        )}
      >
        {done ? <Check className="size-5" /> : <Icon className="size-5" />}
      </div>
      <div className="flex-1">
        <p className={cn("font-medium", done && "text-muted-foreground line-through")}>
          {title}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        {!done && action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}

export default function Onboarding() {
  const user = useAuthStore((s) => s.user);
  const { data: listings } = useListings({ mine: true });
  const { data: connect } = useConnectStatus();
  const { data: verifs } = useMyVerifications();

  const hasBio = Boolean(user?.bio?.trim());
  const hasListing = (listings?.results?.length || 0) > 0;
  const stripeReady = Boolean(connect?.payouts_enabled);
  const verifDone = user?.is_verified || verifs?.results?.[0]?.status === "pending";

  const steps = [hasBio, hasListing, stripeReady, verifDone];
  const completed = steps.filter(Boolean).length;

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-2xl font-bold tracking-tight">Bienvenue, rédacteur !</h1>
      <p className="mt-1 text-muted-foreground">
        Quelques étapes pour bien démarrer sur Kessia.
      </p>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(completed / steps.length) * 100}%` }}
        />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {completed}/{steps.length} étapes complétées
      </p>

      <div className="mt-6 space-y-3">
        <Step
          done={hasBio}
          icon={UserCog}
          title="Complétez votre profil"
          description="Ajoutez une bio pour inspirer confiance aux médecins."
          action={
            <Button asChild size="sm">
              <Link to="/settings">Modifier le profil</Link>
            </Button>
          }
        />
        <Step
          done={hasListing}
          icon={FileText}
          title="Publiez votre première annonce"
          description="Décrivez un service de rédaction que vous proposez."
          action={
            <Button asChild size="sm">
              <Link to="/listings/new">Créer une annonce</Link>
            </Button>
          }
        />
        <Step
          done={stripeReady}
          icon={CreditCard}
          title="Configurez vos paiements"
          description="Reliez votre compte Stripe pour recevoir vos versements."
          action={
            <Button asChild size="sm">
              <Link to="/dashboard/writer">Configurer Stripe</Link>
            </Button>
          }
        />
        <Step
          done={verifDone}
          icon={ShieldCheck}
          title="Demandez la vérification"
          description="Obtenez le badge « Vérifié » en justifiant vos qualifications."
          action={
            <Button asChild size="sm">
              <Link to="/dashboard/writer">Demander la vérification</Link>
            </Button>
          }
        />
      </div>

      <div className="mt-6 flex justify-end">
        <Button asChild variant="outline">
          <Link to="/dashboard/writer">Aller au tableau de bord</Link>
        </Button>
      </div>
    </div>
  );
}
