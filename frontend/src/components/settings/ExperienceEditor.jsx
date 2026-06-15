import { useState } from "react";
import { toast } from "sonner";

import Input from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ConfirmButton from "@/components/ConfirmButton";
import Spinner from "@/components/feedback/Spinner";
import {
  useExperiences,
  useCreateExperience,
  useDeleteExperience,
} from "@/hooks/useProfileContent";
import { yearRange } from "@/lib/profile";
import { errorMessage } from "@/lib/format";

const EMPTY = { role: "", organization: "", start_year: "", end_year: "", description: "" };

export default function ExperienceEditor() {
  const { data: items = [] } = useExperiences();
  const create = useCreateExperience();
  const remove = useDeleteExperience();
  const [form, setForm] = useState(EMPTY);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const add = async (e) => {
    e.preventDefault();
    if (!form.role.trim()) {
      toast.error("Le rôle est requis.");
      return;
    }
    try {
      await create.mutateAsync({
        role: form.role,
        organization: form.organization,
        description: form.description,
        start_year: form.start_year ? Number(form.start_year) : null,
        end_year: form.end_year ? Number(form.end_year) : null,
      });
      setForm(EMPTY);
      toast.success("Expérience ajoutée.");
    } catch (err) {
      toast.error(errorMessage(err, "L'ajout a échoué."));
    }
  };

  const del = async (id) => {
    try {
      await remove.mutateAsync(id);
      toast.success("Expérience supprimée.");
    } catch (err) {
      toast.error(errorMessage(err, "La suppression a échoué."));
    }
  };

  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex items-start justify-between gap-3 rounded-lg border bg-background p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {it.role}
                  {it.organization && (
                    <span className="text-muted-foreground"> · {it.organization}</span>
                  )}
                </p>
                {yearRange(it) && (
                  <p className="text-xs text-muted-foreground">{yearRange(it)}</p>
                )}
              </div>
              <ConfirmButton
                size="sm"
                variant="ghost"
                destructive
                title="Supprimer cette expérience ?"
                confirmLabel="Supprimer"
                onConfirm={() => del(it.id)}
              >
                Supprimer
              </ConfirmButton>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="space-y-3 rounded-lg border border-dashed p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Rôle" value={form.role} onChange={set("role")} placeholder="Médecin rédacteur" />
          <Input
            label="Organisation"
            value={form.organization}
            onChange={set("organization")}
            placeholder="CHU, revue…"
          />
          <Input
            label="Année de début"
            type="number"
            value={form.start_year}
            onChange={set("start_year")}
          />
          <Input
            label="Année de fin (vide = en cours)"
            type="number"
            value={form.end_year}
            onChange={set("end_year")}
          />
        </div>
        <Input label="Description" value={form.description} onChange={set("description")} />
        <Button type="submit" size="sm" variant="outline" disabled={create.isPending}>
          {create.isPending ? <Spinner /> : "Ajouter une expérience"}
        </Button>
      </form>
    </div>
  );
}
