import { z } from "zod";

// Login stays lenient on the password (no strength rule) — the backend is the
// authority and we never want to block a valid existing credential client-side.
export const loginSchema = z.object({
  email: z.string().min(1, "L'e-mail est requis.").email("Adresse e-mail invalide."),
  password: z.string().min(1, "Le mot de passe est requis."),
});

export const registerSchema = z.object({
  email: z.string().min(1, "L'e-mail est requis.").email("Adresse e-mail invalide."),
  password: z.string().min(8, "Au moins 8 caractères."),
  first_name: z.string().trim().min(1, "Le prénom est requis."),
  last_name: z.string().trim().min(1, "Le nom est requis."),
});
