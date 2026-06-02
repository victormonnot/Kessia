import { z } from "zod";

export const profileSchema = z.object({
  first_name: z.string().trim().min(1, "Le prénom est requis."),
  last_name: z.string().trim().min(1, "Le nom est requis."),
  bio: z.string().max(1000, "La bio ne peut pas dépasser 1000 caractères."),
});
