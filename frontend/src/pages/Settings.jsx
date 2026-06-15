import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import AvatarUpload from "@/components/settings/AvatarUpload";
import ProfileForm from "@/components/settings/ProfileForm";
import ExperienceEditor from "@/components/settings/ExperienceEditor";
import PublicationEditor from "@/components/settings/PublicationEditor";
import ChangePasswordForm from "@/components/settings/ChangePasswordForm";
import ChangeEmailForm from "@/components/settings/ChangeEmailForm";
import DeleteAccountSection from "@/components/settings/DeleteAccountSection";
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
          <CardContent className="space-y-6">
            <AvatarUpload />
            <div className="border-t pt-6">
              <ProfileForm />
            </div>
          </CardContent>
        </Card>

        {user?.is_writer && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Parcours</CardTitle>
                <CardDescription>Votre expérience, affichée sur votre profil public.</CardDescription>
              </CardHeader>
              <CardContent>
                <ExperienceEditor />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Publications</CardTitle>
                <CardDescription>Vos articles et papiers phares (avec liens).</CardDescription>
              </CardHeader>
              <CardContent>
                <PublicationEditor />
              </CardContent>
            </Card>
          </>
        )}

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
                <Badge variant="info">Rédacteur</Badge>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sécurité</CardTitle>
            <CardDescription>Gérez votre adresse e-mail et votre mot de passe.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <ChangeEmailForm />
            <div className="border-t pt-8">
              <ChangePasswordForm />
            </div>
          </CardContent>
        </Card>

        {user?.is_writer && (
          <>
            <ConnectCard />
            <VerificationCard />
          </>
        )}

        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Zone de danger</CardTitle>
          </CardHeader>
          <CardContent>
            <DeleteAccountSection />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
