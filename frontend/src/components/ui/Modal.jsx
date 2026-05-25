import { useEffect } from "react";

export default function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
          <button
            type="button"
            className="text-neutral-500 hover:text-neutral-900"
            onClick={onClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </header>
        <div className="px-4 py-4">{children}</div>
        {footer && (
          <footer className="flex justify-end gap-2 border-t border-neutral-200 px-4 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
