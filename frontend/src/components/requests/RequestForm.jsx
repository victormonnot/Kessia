import { useState } from "react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { SPECIALTY_OPTIONS } from "@/lib/choices";

const empty = {
  title: "",
  description: "",
  specialty: "general_medicine",
  deadline: "",
  budget: "",
  status: "open",
};

export default function RequestForm({ initial, onSubmit, submitting }) {
  const [form, setForm] = useState({ ...empty, ...(initial || {}) });
  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, budget: String(form.budget) });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Input label="Titre" name="title" required value={form.title} onChange={change} />
      <Textarea
        label="Description"
        name="description"
        rows={6}
        required
        value={form.description}
        onChange={change}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Select
          label="Spécialité"
          name="specialty"
          options={SPECIALTY_OPTIONS}
          value={form.specialty}
          onChange={change}
        />
        <Input
          label="Échéance"
          name="deadline"
          type="date"
          required
          value={form.deadline}
          onChange={change}
        />
        <Input
          label="Budget (€)"
          name="budget"
          type="number"
          step="0.01"
          required
          value={form.budget}
          onChange={change}
        />
      </div>
      {initial && (
        <Select
          label="Statut"
          name="status"
          options={[
            { value: "open", label: "Ouverte" },
            { value: "closed", label: "Fermée" },
          ]}
          value={form.status}
          onChange={change}
        />
      )}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Enregistrement…" : "Enregistrer la demande"}
      </Button>
    </form>
  );
}
