import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BadgeCheck, Clock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { TextareaField } from "@/components/form/fields";
import Spinner from "@/components/feedback/Spinner";
import { errorMessage } from "@/lib/format";
import { useAuthStore } from "@/store/authStore";
import { useMyVerifications, useRequestVerification } from "@/hooks/useVerification";

const schema = z.object({
  credentials: z.string().trim().min(10, "Décrivez vos qualifications (10 caractères minimum)."),
});

// Verification request card — reused by the writer dashboard and settings.
export default function VerificationCard() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useMyVerifications();
  const request = useRequestVerification();
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { credentials: "" },
  });

  if (user?.is_verified) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-6 text-sm font-medium text-emerald-700">
          <BadgeCheck className="size-5" /> Votre compte est vérifié.
        </CardContent>
      </Card>
    );
  }

  const latest = data?.results?.[0];
  const pending = latest?.status === "pending";

  const submit = async (values) => {
    try {
      await request.mutateAsync({ credentials: values.credentials });
      toast.success("Demande de vérification envoyée.");
      form.reset({ credentials: "" });
    } catch (e) {
      toast.error(errorMessage(e, "L'envoi de la demande a échoué."));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Vérification du profil</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : pending ? (
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4" /> Votre demande est en cours d'examen par notre équipe.
          </p>
        ) : (
          <>
            {latest?.status === "rejected" && (
              <p className="text-sm text-destructive">
                Votre précédente demande a été refusée. Vous pouvez en soumettre une nouvelle.
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Décrivez vos qualifications (diplômes, expérience). Après validation par un
              administrateur, un badge « Vérifié » apparaîtra sur votre profil et vos annonces.
            </p>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(submit)} className="space-y-3" noValidate>
                <TextareaField
                  control={form.control}
                  name="credentials"
                  label="Justificatifs"
                  rows={4}
                  placeholder="Ex. Doctorat en médecine, 8 ans d'expérience en rédaction scientifique…"
                />
                <Button type="submit" disabled={request.isPending}>
                  {request.isPending ? (
                    <>
                      <Spinner /> Envoi…
                    </>
                  ) : (
                    "Demander la vérification"
                  )}
                </Button>
              </form>
            </Form>
          </>
        )}
      </CardContent>
    </Card>
  );
}
