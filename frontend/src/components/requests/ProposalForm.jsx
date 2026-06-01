import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TextareaField, TextField } from "@/components/form/fields";
import Spinner from "@/components/feedback/Spinner";
import { proposalSchema } from "@/lib/schemas/request";
import { errorMessage } from "@/lib/format";

export default function ProposalForm({ onSubmit, submitting }) {
  const form = useForm({
    resolver: zodResolver(proposalSchema),
    defaultValues: { message: "", price: "" },
  });

  const submit = async (values) => {
    try {
      await onSubmit({ message: values.message, price: String(values.price) });
      toast.success("Proposition envoyée.");
      form.reset({ message: "", price: "" });
    } catch (err) {
      toast.error(errorMessage(err, "L'envoi de la proposition a échoué."));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-4" noValidate>
        <TextareaField
          control={form.control}
          name="message"
          label="Message"
          rows={4}
          placeholder="Présentez votre approche, votre expérience et vos délais…"
        />
        <TextField
          control={form.control}
          name="price"
          label="Prix proposé (€)"
          type="number"
          step="0.01"
          min="0"
          placeholder="280"
        />
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Spinner /> Envoi…
            </>
          ) : (
            "Envoyer la proposition"
          )}
        </Button>
      </form>
    </Form>
  );
}
