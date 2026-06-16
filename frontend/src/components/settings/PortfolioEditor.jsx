import { useState } from "react";
import { toast } from "sonner";

import Input from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ConfirmButton from "@/components/ConfirmButton";
import Spinner from "@/components/feedback/Spinner";
import {
  usePortfolio,
  useCreatePortfolio,
  useUpdatePortfolio,
  useDeletePortfolio,
} from "@/hooks/useProfileContent";
import { errorMessage } from "@/lib/format";

const EMPTY = { title: "", kind: "", url: "", summary: "" };

function toPayload(form) {
  return { title: form.title, kind: form.kind, url: form.url, summary: form.summary };
}

function fromItem(it) {
  return {
    title: it.title || "",
    kind: it.kind || "",
    url: it.url || "",
    summary: it.summary || "",
  };
}

// Field set reused by the "add" form and the inline "edit" form.
function PortfolioFields({ form, setForm }) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <>
      <Input label="Titre" value={form.title} onChange={set("title")} placeholder="Méta-analyse en cardiologie" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Type"
          value={form.kind}
          onChange={set("kind")}
          placeholder="Article original, revue…"
        />
        <Input label="Lien" value={form.url} onChange={set("url")} placeholder="https://…" />
      </div>
      <Input label="Description" value={form.summary} onChange={set("summary")} />
    </>
  );
}

export default function PortfolioEditor() {
  const { data: items = [] } = usePortfolio();
  const create = useCreatePortfolio();
  const update = useUpdatePortfolio();
  const remove = useDeletePortfolio();
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY);

  const add = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Le titre est requis.");
      return;
    }
    try {
      await create.mutateAsync(toPayload(form));
      setForm(EMPTY);
      toast.success("Réalisation ajoutée.");
    } catch (err) {
      toast.error(errorMessage(err, "L'ajout a échoué."));
    }
  };

  const startEdit = (it) => {
    setEditingId(it.id);
    setEditForm(fromItem(it));
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) {
      toast.error("Le titre est requis.");
      return;
    }
    try {
      await update.mutateAsync({ id: editingId, data: toPayload(editForm) });
      setEditingId(null);
      toast.success("Réalisation modifiée.");
    } catch (err) {
      toast.error(errorMessage(err, "La modification a échoué."));
    }
  };

  const del = async (id) => {
    try {
      await remove.mutateAsync(id);
      if (editingId === id) setEditingId(null);
      toast.success("Réalisation supprimée.");
    } catch (err) {
      toast.error(errorMessage(err, "La suppression a échoué."));
    }
  };

  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((it) =>
            editingId === it.id ? (
              <li key={it.id} className="rounded-lg border bg-background p-3">
                <form onSubmit={saveEdit} className="space-y-3">
                  <PortfolioFields form={editForm} setForm={setEditForm} />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={update.isPending}>
                      {update.isPending ? <Spinner /> : "Enregistrer"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      Annuler
                    </Button>
                  </div>
                </form>
              </li>
            ) : (
              <li
                key={it.id}
                className="flex items-start justify-between gap-3 rounded-lg border bg-background p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{it.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {[it.kind, it.summary].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button type="button" size="sm" variant="ghost" onClick={() => startEdit(it)}>
                    Modifier
                  </Button>
                  <ConfirmButton
                    size="sm"
                    variant="ghost"
                    destructive
                    title="Supprimer cette réalisation ?"
                    confirmLabel="Supprimer"
                    onConfirm={() => del(it.id)}
                  >
                    Supprimer
                  </ConfirmButton>
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      <form onSubmit={add} className="space-y-3 rounded-lg border border-dashed p-4">
        <PortfolioFields form={form} setForm={setForm} />
        <Button type="submit" size="sm" variant="outline" disabled={create.isPending}>
          {create.isPending ? <Spinner /> : "Ajouter une réalisation"}
        </Button>
      </form>
    </div>
  );
}
