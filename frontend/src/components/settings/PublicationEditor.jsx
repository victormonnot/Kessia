import { useState } from "react";
import { toast } from "sonner";

import Input from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import ConfirmButton from "@/components/ConfirmButton";
import Spinner from "@/components/feedback/Spinner";
import {
  usePublications,
  useCreatePublication,
  useDeletePublication,
} from "@/hooks/useProfileContent";
import { errorMessage } from "@/lib/format";

const EMPTY = { title: "", venue: "", year: "", url: "", is_featured: false };

export default function PublicationEditor() {
  const { data: items = [] } = usePublications();
  const create = useCreatePublication();
  const remove = useDeletePublication();
  const [form, setForm] = useState(EMPTY);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const add = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Le titre est requis.");
      return;
    }
    try {
      await create.mutateAsync({
        title: form.title,
        venue: form.venue,
        url: form.url,
        is_featured: form.is_featured,
        year: form.year ? Number(form.year) : null,
      });
      setForm(EMPTY);
      toast.success("Publication ajoutée.");
    } catch (err) {
      toast.error(errorMessage(err, "L'ajout a échoué."));
    }
  };

  const del = async (id) => {
    try {
      await remove.mutateAsync(id);
      toast.success("Publication supprimée.");
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
                  {it.is_featured && "★ "}
                  {it.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {[it.venue, it.year].filter(Boolean).join(" · ")}
                </p>
              </div>
              <ConfirmButton
                size="sm"
                variant="ghost"
                destructive
                title="Supprimer cette publication ?"
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
        <Input label="Titre" value={form.title} onChange={set("title")} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Revue / congrès" value={form.venue} onChange={set("venue")} />
          <Input label="Année" type="number" value={form.year} onChange={set("year")} />
        </div>
        <Input
          label="Lien"
          value={form.url}
          onChange={set("url")}
          placeholder="https://doi.org/…"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_featured}
            onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
            className="size-4 rounded border-input"
          />
          Mettre en avant (publication phare)
        </label>
        <Button type="submit" size="sm" variant="outline" disabled={create.isPending}>
          {create.isPending ? <Spinner /> : "Ajouter une publication"}
        </Button>
      </form>
    </div>
  );
}
