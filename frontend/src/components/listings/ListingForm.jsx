import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  TextField,
  TextareaField,
  SelectField,
  SwitchField,
  ComboboxField,
} from "@/components/form/fields";
import Spinner from "@/components/feedback/Spinner";
import { DELIVERABLE_OPTIONS, SPECIALTY_OPTIONS } from "@/lib/choices";
import { listingSchema } from "@/lib/schemas/listing";

const DEFAULTS = {
  title: "",
  description: "",
  specialty: "",
  deliverable_type: "",
  price: "",
  turnaround_days: 7,
  is_published: true,
};

export default function ListingForm({ initial, onSubmit, submitting }) {
  const form = useForm({
    resolver: zodResolver(listingSchema),
    defaultValues: initial
      ? {
          title: initial.title ?? "",
          description: initial.description ?? "",
          specialty: initial.specialty ?? "",
          deliverable_type: initial.deliverable_type ?? "",
          price: initial.price ?? "",
          turnaround_days: initial.turnaround_days ?? 7,
          is_published: initial.is_published ?? true,
        }
      : DEFAULTS,
  });

  const [faq, setFaq] = useState(Array.isArray(initial?.faq) ? initial.faq : []);
  const addFaq = () => setFaq((f) => [...f, { question: "", answer: "" }]);
  const updateFaq = (i, key, val) =>
    setFaq((f) => f.map((it, idx) => (idx === i ? { ...it, [key]: val } : it)));
  const removeFaq = (i) => setFaq((f) => f.filter((_, idx) => idx !== i));

  const submit = (values) =>
    onSubmit({
      ...values,
      price: String(values.price),
      turnaround_days: Number(values.turnaround_days),
      faq: faq.filter((it) => it.question.trim() && it.answer.trim()),
    });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-5" noValidate>
        <TextField
          control={form.control}
          name="title"
          label="Titre"
          placeholder="Ex. Rédaction d'un article de recherche en cardiologie"
        />
        <TextareaField
          control={form.control}
          name="description"
          label="Description"
          rows={6}
          placeholder="Décrivez votre service, votre méthodologie, ce qui est inclus…"
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <ComboboxField
            control={form.control}
            name="specialty"
            label="Spécialité"
            options={SPECIALTY_OPTIONS}
            placeholder="Choisir une spécialité"
            searchPlaceholder="Rechercher une spécialité…"
          />
          <SelectField
            control={form.control}
            name="deliverable_type"
            label="Type de livrable"
            options={DELIVERABLE_OPTIONS}
            placeholder="Choisir un livrable"
          />
          <TextField
            control={form.control}
            name="price"
            label="Prix (€)"
            type="number"
            step="0.01"
            min="0"
            placeholder="250"
          />
          <TextField
            control={form.control}
            name="turnaround_days"
            label="Délai (jours)"
            type="number"
            min="1"
            placeholder="7"
          />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">FAQ</p>
              <p className="text-sm text-muted-foreground">
                Questions fréquentes sur votre service (facultatif).
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addFaq}>
              <Plus className="size-4" /> Ajouter
            </Button>
          </div>
          {faq.map((item, i) => (
            <div key={i} className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Input
                  value={item.question}
                  onChange={(e) => updateFaq(i, "question", e.target.value)}
                  placeholder="Question"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFaq(i)}
                  aria-label="Supprimer la question"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <Textarea
                value={item.answer}
                onChange={(e) => updateFaq(i, "answer", e.target.value)}
                placeholder="Réponse"
                rows={2}
              />
            </div>
          ))}
        </div>

        <SwitchField
          control={form.control}
          name="is_published"
          label="Publiée"
          description="Rendre cette annonce visible dans le catalogue."
        />
        <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? (
            <>
              <Spinner /> Enregistrement…
            </>
          ) : (
            "Enregistrer l'annonce"
          )}
        </Button>
      </form>
    </Form>
  );
}
