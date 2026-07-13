// FR labels + icons for the order activity log (backend: OrderEvent.Type).
// Mirror of apps/orders/models.py OrderEvent.Type — keep in sync.

import {
  BadgeCheck,
  Ban,
  Banknote,
  CheckCircle2,
  Paperclip,
  RefreshCw,
  ShoppingBag,
  Undo2,
  Upload,
  Wallet,
  XCircle,
} from "lucide-react";

export const ORDER_EVENT_META = {
  placed: { label: "Commande passée", icon: ShoppingBag },
  accepted: { label: "Commande acceptée", icon: CheckCircle2 },
  declined: { label: "Commande refusée", icon: XCircle },
  paid: { label: "Paiement séquestré", icon: Wallet },
  delivered: { label: "Travail livré", icon: Upload },
  completed: { label: "Commande finalisée", icon: BadgeCheck },
  cancelled: { label: "Commande annulée", icon: Ban },
  refunded: { label: "Paiement remboursé", icon: Undo2 },
  released: { label: "Paiement versé au rédacteur", icon: Banknote },
  document_added: { label: "Document ajouté", icon: Paperclip },
  revision_requested: { label: "Révision demandée", icon: RefreshCw },
};
