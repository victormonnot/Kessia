// Miroir d'apps/common/choices.py. Garder synchronisé si le backend change.

export const SPECIALTY_OPTIONS = [
  { value: "general_medicine", label: "Médecine générale" },
  { value: "cardiology", label: "Cardiologie" },
  { value: "oncology", label: "Oncologie" },
  { value: "neurology", label: "Neurologie" },
  { value: "pediatrics", label: "Pédiatrie" },
  { value: "surgery", label: "Chirurgie" },
  { value: "psychiatry", label: "Psychiatrie" },
  { value: "radiology", label: "Radiologie" },
  { value: "dermatology", label: "Dermatologie" },
  { value: "endocrinology", label: "Endocrinologie" },
  { value: "gastroenterology", label: "Gastro-entérologie" },
  { value: "other", label: "Autre" },
];

export const DELIVERABLE_OPTIONS = [
  { value: "research_paper", label: "Article de recherche" },
  { value: "review_article", label: "Article de revue" },
  { value: "case_report", label: "Étude de cas" },
  { value: "abstract", label: "Résumé" },
  { value: "other", label: "Autre" },
];

export const STATUS_LABELS = {
  pending: "En attente",
  accepted: "Acceptée",
  declined: "Refusée",
  delivered: "Livrée",
  rejected: "Rejetée",
  open: "Ouverte",
  closed: "Fermée",
};

export function labelFor(value, options) {
  return options.find((o) => o.value === value)?.label ?? value;
}
