import { z } from "zod";

export const profileSchema = z.object({
  first_name: z.string().trim().min(1, "Le prénom est requis."),
  last_name: z.string().trim().min(1, "Le nom est requis."),
  bio: z.string().max(1000, "La bio ne peut pas dépasser 1000 caractères."),
  // Writer-only fields (ignored for doctors); all optional.
  headline: z.string().max(160, "160 caractères maximum.").optional().or(z.literal("")),
  city: z.string().max(120, "120 caractères maximum.").optional().or(z.literal("")),
  google_scholar_url: z
    .string()
    .url("Lien invalide (ex. https://scholar.google.com/...).")
    .optional()
    .or(z.literal("")),
  years_experience: z
    .string()
    .regex(/^\d*$/, "Indiquez un nombre d'années.")
    .optional()
    .or(z.literal("")),
  expertise: z.string().max(300, "300 caractères maximum.").optional().or(z.literal("")),
  show_expertise: z.boolean().optional(),
  show_experiences: z.boolean().optional(),
  show_publications: z.boolean().optional(),
  show_scholar: z.boolean().optional(),
});
