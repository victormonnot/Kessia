import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TextField, TextareaField, SelectField, ComboboxField } from "@/components/form/fields";
import Spinner from "@/components/feedback/Spinner";
import { SPECIALTY_OPTIONS } from "@/lib/choices";
import { requestSchema } from "@/lib/schemas/request";

const STATUS_OPTIONS = [
  { value: "open", label: "Ouverte" },
  { value: "closed", label: "Fermée" },
];

const DEFAULTS = {
  title: "",
  description: "",
  specialty: "",
  deadline: "",
  budget: "",
  status: "open",
};

export default function RequestForm({ initial, onSubmit, submitting }) {
  const isEdit = Boolean(initial);
  const form = useForm({
    resolver: zodResolver(requestSchema),
    defaultValues: initial
      ? {
          title: initial.title ?? "",
          description: initial.description ?? "",
          specialty: initial.specialty ?? "",
          deadline: initial.deadline ?? "",
          budget: initial.budget ?? "",
          status: initial.status ?? "open",
        }
      : DEFAULTS,
  });

  const submit = (values) => onSubmit({ ...values, budget: String(values.budget) });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-5" noValidate>
        <TextField
          control={form.control}
          name="title"
          label="Titre"
          placeholder="Ex. Rédaction d'une revue systématique en oncologie"
        />
        <TextareaField
          control={form.control}
          name="description"
          label="Description"
          rows={6}
          placeholder="Décrivez votre besoin : objectifs, format attendu, contexte…"
        />
        <div className="grid gap-5 sm:grid-cols-3">
          <ComboboxField
            control={form.control}
            name="specialty"
            label="Spécialité"
            options={SPECIALTY_OPTIONS}
            placeholder="Choisir"
            searchPlaceholder="Rechercher une spécialité…"
          />
          <TextField control={form.control} name="deadline" label="Échéance" type="date" />
          <TextField
            control={form.control}
            name="budget"
            label="Budget (€)"
            type="number"
            step="0.01"
            min="0"
            placeholder="300"
          />
        </div>
        {isEdit && (
          <SelectField
            control={form.control}
            name="status"
            label="Statut"
            options={STATUS_OPTIONS}
          />
        )}
        <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? (
            <>
              <Spinner /> Enregistrement…
            </>
          ) : (
            "Enregistrer la demande"
          )}
        </Button>
      </form>
    </Form>
  );
}
