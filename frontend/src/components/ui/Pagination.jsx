import { ChevronLeft, ChevronRight } from "lucide-react";

import Button from "@/components/ui/Button";

export default function Pagination({ page, hasPrev, hasNext, onPage }) {
  if (!hasPrev && !hasNext) return null;
  return (
    <div className="mt-8 flex items-center justify-center gap-3">
      <Button variant="outline" size="sm" disabled={!hasPrev} onClick={() => onPage(page - 1)}>
        <ChevronLeft className="size-4" />
        Précédent
      </Button>
      <span className="text-sm text-muted-foreground">Page {page}</span>
      <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => onPage(page + 1)}>
        Suivant
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
