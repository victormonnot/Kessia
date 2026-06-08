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
  accept_terms: z.boolean().refine((v) => v === true, {
    message: "Vous devez accepter les CGU et la politique de confidentialité.",
  }),
});

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "L'e-mail est requis.").email("Adresse e-mail invalide."),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Au moins 8 caractères."),
    confirm: z.string().min(1, "Confirmez le mot de passe."),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirm"],
  });

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Mot de passe actuel requis."),
    new_password: z.string().min(8, "Au moins 8 caractères."),
    confirm: z.string().min(1, "Confirmez le mot de passe."),
  })
  .refine((data) => data.new_password === data.confirm, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirm"],
  });

export const changeEmailSchema = z
  .object({
    new_email: z.string().min(1, "L'e-mail est requis.").email("Adresse e-mail invalide."),
    confirm_email: z.string().min(1, "Confirmez la nouvelle adresse e-mail."),
    current_password: z.string().min(1, "Mot de passe requis."),
  })
  .refine(
    (data) => data.new_email.trim().toLowerCase() === data.confirm_email.trim().toLowerCase(),
    {
      message: "Les adresses e-mail ne correspondent pas.",
      path: ["confirm_email"],
    },
  );

export const deleteAccountSchema = z.object({
  current_password: z.string().min(1, "Mot de passe requis."),
});
