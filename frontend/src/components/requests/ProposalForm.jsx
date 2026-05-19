import { useState } from "react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";

export default function ProposalForm({ onSubmit, submitting }) {
  const [form, setForm] = useState({ message: "", price: "" });
  const [error, setError] = useState(null);
  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await onSubmit({ ...form, price: String(form.price) });
      setForm({ message: "", price: "" });
    } catch (err) {
      const detail = err.response?.data;
      setError(typeof detail === "string" ? detail : JSON.stringify(detail));
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <Textarea
        label="Message"
        name="message"
        rows={4}
        required
        value={form.message}
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
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Envoi…" : "Envoyer la proposition"}
      </Button>
    </form>
  );
}
