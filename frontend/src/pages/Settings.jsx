import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Badge from "@/components/ui/Badge";
import ProfileForm from "@/components/settings/ProfileForm";
import ConnectCard from "@/components/payments/ConnectCard";
import VerificationCard from "@/components/verification/VerificationCard";
import { useActivateWriter } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { errorMessage } from "@/lib/format";

export default function Settings() {
  const user = useAuthStore((s) => s.user);
  const activate = useActivateWriter();
  const navigate = useNavigate();

  const becomeWriter = async () => {
    try {
      await activate.mutateAsync();
      toast.success("Mode rédacteur activé !");
      navigate("/onboarding");
    } catch (e) {
      toast.error(errorMessage(e, "L'activation a échoué."));
    }
  };

  return (
    <div className="container max-w-3xl py-8">
      <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>

      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profil</CardTitle>
            <CardDescription>
              Ces informations sont visibles sur votre profil public.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">E-mail</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <div>
                <p className="text-sm font-medium">Rôle</p>
                <p className="text-sm text-muted-foreground">
                  {user?.is_writer ? "Médecin & rédacteur" : "Médecin"}
                </p>
              </div>
              {user?.is_writer ? (
                <Badge variant="primary">Rédacteur</Badge>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={becomeWriter}
                  disabled={activate.isPending}
                >
                  {activate.isPending ? "Activation…" : "Devenir rédacteur"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {user?.is_writer && (
          <>
            <ConnectCard />
            <VerificationCard />
          </>
        )}
      </div>
    </div>
  );
}
