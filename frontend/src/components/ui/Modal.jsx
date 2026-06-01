import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Compatibility wrapper keeping the v1 API ({ open, onClose, title, footer })
// on top of the accessible Radix Dialog (focus trap, ESC, animations, portal).
// `description` is optional; we always render one (sr-only fallback) so Radix's
// accessible-description requirement is satisfied without a console warning.
export default function Modal({ open, onClose, title, description, children, footer }) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
    >
      <DialogContent>
        <DialogHeader>
          {title && <DialogTitle>{title}</DialogTitle>}
          <DialogDescription className={description ? undefined : "sr-only"}>
            {description || title}
          </DialogDescription>
        </DialogHeader>
        <div className="text-sm text-foreground">{children}</div>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
