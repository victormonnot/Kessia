import { Check } from "lucide-react";

import Badge from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/choices";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "placed", label: "Commande" },
  { key: "accepted", label: "Acceptée" },
  { key: "in_progress", label: "En cours" },
  { key: "delivered", label: "Livrée" },
  { key: "completed", label: "Terminée" },
];

// Status -> index of the furthest step reached. Payment isn't a step of its own:
// confirming payment is what moves an accepted order to "in_progress".
const STATUS_TO_INDEX = {
  pending: 0,
  accepted: 1,
  in_progress: 2,
  delivered: 3,
  completed: 4,
};

const TERMINAL = { declined: "danger", cancelled: "neutral" };

export default function OrderStepper({ status }) {
  const terminalVariant = TERMINAL[status];

  // Refused / cancelled orders fall off the happy path: show the track muted with
  // a terminal pill rather than a misleading "progress".
  if (terminalVariant) {
    return (
      <div className="flex items-center gap-3">
        <Stepper currentIndex={-1} muted />
        <Badge variant={terminalVariant}>{STATUS_LABELS[status] || status}</Badge>
      </div>
    );
  }

  return <Stepper currentIndex={STATUS_TO_INDEX[status] ?? 0} />;
}

function Stepper({ currentIndex, muted = false }) {
  return (
    <ol className="flex items-center gap-1 overflow-x-auto">
      {STEPS.map((step, i) => {
        const done = !muted && i < currentIndex;
        const current = !muted && i === currentIndex;
        return (
          <li key={step.key} className="flex items-center gap-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  done && "border-primary bg-primary text-primary-foreground",
                  current && "border-primary text-primary",
                  !done && !current && "border-muted-foreground/30 text-muted-foreground",
                )}
                aria-current={current ? "step" : undefined}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "whitespace-nowrap text-xs font-medium",
                  current ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  "mx-1 h-px w-5 shrink-0",
                  done ? "bg-primary" : "bg-muted-foreground/30",
                )}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
