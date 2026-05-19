import { useState } from "react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { DELIVERABLE_OPTIONS, SPECIALTY_OPTIONS } from "@/lib/choices";

const empty = {
  title: "",
  description: "",
  specialty: "general_medicine",
  deliverable_type: "research_paper",
  price: "",
  turnaround_days: 7,
  is_published: true,
};

export default function ListingForm({ initial, onSubmit, submitting }) {
  const [form, setForm] = useState({ ...empty, ...(initial || {}) });
  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      price: String(form.price),
      turnaround_days: Number(form.turnaround_days),
    });
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
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Spécialité"
          name="specialty"
          options={SPECIALTY_OPTIONS}
          value={form.specialty}
          onChange={change}
        />
        <Select
          label="Livrable"
          name="deliverable_type"
          options={DELIVERABLE_OPTIONS}
          value={form.deliverable_type}
          onChange={change}
        />
        <Input
          label="Prix (€)"
          name="price"
          type="number"
          step="0.01"
          required
          value={form.price}
          onChange={change}
        />
        <Input
          label="Délai (jours)"
          name="turnaround_days"
          type="number"
          min="1"
          required
          value={form.turnaround_days}
          onChange={change}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_published"
          checked={form.is_published}
          onChange={change}
        />
        Publiée
      </label>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Enregistrement…" : "Enregistrer l'annonce"}
      </Button>
    </form>
  );
}
