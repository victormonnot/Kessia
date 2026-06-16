// Miroir d'apps/common/choices.py. Garder synchronisé si le backend change.

export const SPECIALTY_OPTIONS = [
  { value: "addictologie", label: "Addictologie" },
  { value: "anatomie_pathologique", label: "Anatomie cytologie pathologique" },
  { value: "bacteriologie", label: "Bactériologie et hygiène" },
  { value: "biochimie", label: "Biochimie" },
  { value: "biologie", label: "Biologie" },
  { value: "cardiologie", label: "Cardiologie" },
  { value: "dermatologie", label: "Dermatologie" },
  { value: "diabetologie", label: "Diabétologie" },
  { value: "endocrinologie", label: "Endocrinologie et nutrition" },
  { value: "epidemiologie", label: "Epidémiologie clinique et santé publique" },
  { value: "gastroenterologie", label: "Gastroentérologie et pancréatologie" },
  { value: "genetique", label: "Génétique médicale" },
  { value: "gynecologie", label: "Gynécologie" },
  { value: "hematologie", label: "Hématologie" },
  { value: "hepatologie", label: "Hépatologie" },
  { value: "immunologie", label: "Immunologie" },
  { value: "neonatologie", label: "Néonatologie et réanimation néonatale" },
  { value: "nephrologie", label: "Néphrologie" },
  { value: "neurochirurgie", label: "Neurochirurgie" },
  { value: "neurologie", label: "Neurologie" },
  { value: "obstetrique", label: "Obstétrique" },
  { value: "odontologie", label: "Odontologie" },
  { value: "oncologie", label: "Oncologie médicale" },
  { value: "ophtalmologie", label: "Ophtalmologie" },
  { value: "orl", label: "Oto-rhino-laryngologie (ORL)" },
  { value: "parasitologie", label: "Parasitologie et mycologie" },
  { value: "pediatrie", label: "Pédiatrie générale et infectiologie" },
  { value: "pharmacologie", label: "Pharmacologie" },
  { value: "allergologie", label: "Allergologie" },
  { value: "pneumologie", label: "Pneumologie" },
  { value: "psychiatrie", label: "Psychiatrie et psychologie" },
  { value: "radiologie", label: "Radiologie" },
  { value: "rhumatologie", label: "Rhumatologie" },
  { value: "urologie", label: "Urologie" },
  { value: "virologie", label: "Virologie" },
  { value: "autres", label: "Autres" },
];

export const DELIVERABLE_OPTIONS = [
  { value: "protocole_recherche", label: "Protocole de recherche" },
  { value: "vulgarisation", label: "Vulgarisation scientifique" },
  { value: "synopsis_recherche", label: "Synopsis de recherche" },
  { value: "resume_recherche", label: "Résumé de recherche" },
  { value: "autres", label: "Autres" },
];

export const RESPONSE_TIME_OPTIONS = [
  { value: "few_hours", label: "Quelques heures" },
  { value: "one_day", label: "Moins d'un jour" },
  { value: "few_days", label: "1 à 3 jours" },
];

export const STATUS_LABELS = {
  pending: "En attente",
  accepted: "Acceptée",
  declined: "Refusée",
  in_progress: "En cours",
  delivered: "Livrée",
  completed: "Finalisée",
  cancelled: "Annulée",
  rejected: "Rejetée",
  open: "Ouverte",
  closed: "Fermée",
};

export const PAYMENT_STATUS_LABELS = {
  unpaid: "Non payée",
  processing: "Paiement en cours",
  held: "Paiement séquestré",
  released: "Versée au rédacteur",
  refunded: "Remboursée",
  failed: "Échec du paiement",
};

export function labelFor(value, options) {
  return options.find((o) => o.value === value)?.label ?? value;
}
