import { z } from "zod";

export const listingSchema = z.object({
  title: z.string().trim().min(3, "Le titre est trop court."),
  description: z.string().trim().min(20, "Décrivez votre service (20 caractères minimum)."),
  specialty: z.string().min(1, "Choisissez une spécialité."),
  deliverable_type: z.string().min(1, "Choisissez un type de livrable."),
  price: z.coerce
    .number({ invalid_type_error: "Prix invalide." })
    .positive("Le prix doit être supérieur à 0."),
  turnaround_days: z.coerce
    .number({ invalid_type_error: "Délai invalide." })
    .int("Nombre de jours entier.")
    .min(1, "Au moins 1 jour."),
  is_published: z.boolean(),
});
