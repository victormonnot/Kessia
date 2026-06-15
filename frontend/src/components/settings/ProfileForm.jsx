import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TextField, TextareaField, SwitchField } from "@/components/form/fields";
import Spinner from "@/components/feedback/Spinner";
import { profileSchema } from "@/lib/schemas/profile";
import { sectionVisible } from "@/lib/profile";
import { errorMessage } from "@/lib/format";
import { useAuthStore } from "@/store/authStore";
import { useUpdateProfile } from "@/hooks/useAuth";

export default function ProfileForm() {
  const user = useAuthStore((s) => s.user);
  const isWriter = Boolean(user?.is_writer);
  const update = useUpdateProfile();
  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      bio: user?.bio || "",
      headline: user?.headline || "",
      city: user?.city || "",
      google_scholar_url: user?.google_scholar_url || "",
      years_experience: user?.years_experience != null ? String(user.years_experience) : "",
      expertise: (user?.expertise_areas || []).join(", "),
      show_expertise: sectionVisible(user, "expertise"),
      show_experiences: sectionVisible(user, "experiences"),
      show_publications: sectionVisible(user, "publications"),
      show_scholar: sectionVisible(user, "scholar"),
    },
  });

  const submit = async (values) => {
    const payload = {
      first_name: values.first_name,
      last_name: values.last_name,
      bio: values.bio,
    };
    if (isWriter) {
      payload.headline = values.headline || "";
      payload.city = values.city || "";
      payload.google_scholar_url = values.google_scholar_url || "";
      payload.years_experience = values.years_experience ? Number(values.years_experience) : null;
      payload.expertise_areas = values.expertise
        ? values.expertise.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      payload.profile_sections = {
        expertise: values.show_expertise,
        experiences: values.show_experiences,
        publications: values.show_publications,
        scholar: values.show_scholar,
      };
    }
    try {
      await update.mutateAsync(payload);
      toast.success("Profil mis à jour.");
    } catch (e) {
      toast.error(errorMessage(e, "La mise à jour du profil a échoué."));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField control={form.control} name="first_name" label="Prénom" />
          <TextField control={form.control} name="last_name" label="Nom" />
        </div>
        <TextareaField
          control={form.control}
          name="bio"
          label="Bio"
          rows={4}
          placeholder="Présentez votre parcours, vos spécialités et votre approche…"
        />

        {isWriter && (
          <>
            <TextField
              control={form.control}
              name="headline"
              label="Titre"
              description="Une ligne d'accroche, ex. « Médecin-rédacteur · cardiologie »."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField control={form.control} name="city" label="Ville" />
              <TextField
                control={form.control}
                name="years_experience"
                label="Années d'expérience"
                inputMode="numeric"
              />
            </div>
            <TextField
              control={form.control}
              name="google_scholar_url"
              label="Lien Google Scholar"
              placeholder="https://scholar.google.com/citations?user=…"
            />
            <TextField
              control={form.control}
              name="expertise"
              label="Domaines d'expertise"
              description="Séparés par des virgules, ex. « Méta-analyses, Essais cliniques »."
            />

            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-medium">Sections affichées sur votre profil</p>
              <SwitchField control={form.control} name="show_expertise" label="Domaines d'expertise" />
              <SwitchField control={form.control} name="show_experiences" label="Parcours" />
              <SwitchField control={form.control} name="show_publications" label="Publications" />
              <SwitchField control={form.control} name="show_scholar" label="Lien Google Scholar" />
            </div>
          </>
        )}

        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? (
            <>
              <Spinner /> Enregistrement…
            </>
          ) : (
            "Enregistrer"
          )}
        </Button>
      </form>
    </Form>
  );
}
