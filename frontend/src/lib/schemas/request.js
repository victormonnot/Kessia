import { z } from "zod";

export const requestSchema = z.object({
  title: z.string().trim().min(3, "Le titre est trop court."),
  description: z.string().trim().min(20, "Décrivez votre besoin (20 caractères minimum)."),
  specialty: z.string().min(1, "Choisissez une spécialité."),
  deadline: z.string().min(1, "Choisissez une échéance."),
  budget: z.coerce
    .number({ invalid_type_error: "Budget invalide." })
    .positive("Le budget doit être supérieur à 0."),
  status: z.enum(["open", "closed"]),
});

export const proposalSchema = z.object({
  message: z.string().trim().min(10, "Détaillez votre proposition (10 caractères minimum)."),
  price: z.coerce
    .number({ invalid_type_error: "Prix invalide." })
    .positive("Le prix doit être supérieur à 0."),
});
