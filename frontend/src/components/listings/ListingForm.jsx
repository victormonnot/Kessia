import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
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
  deliverable_type: "research_paper",
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
          deliverable_type: initial.deliverable_type ?? "research_paper",
          price: initial.price ?? "",
          turnaround_days: initial.turnaround_days ?? 7,
          is_published: initial.is_published ?? true,
        }
      : DEFAULTS,
  });

  const submit = (values) =>
    onSubmit({
      ...values,
      price: String(values.price),
      turnaround_days: Number(values.turnaround_days),
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
