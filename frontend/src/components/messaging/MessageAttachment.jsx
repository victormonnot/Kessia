import { useState } from "react";
import { Download, Eye, FileText, Paperclip } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Spinner from "@/components/feedback/Spinner";
import { cn } from "@/lib/utils";
import { errorMessage, formatBytes } from "@/lib/format";
import { messagingApi } from "@/api/messaging";
import { useAttachmentUrl } from "@/hooks/useMessaging";

const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "webp"];

// Whether this browser can render PDFs inline (false on most mobile browsers and
// where the built-in viewer is disabled). Drives the iframe-vs-fallback choice.
const CAN_INLINE_PDF = typeof navigator !== "undefined" && navigator.pdfViewerEnabled === true;

function classify(name = "") {
  const ext = name.split(".").pop()?.toLowerCase();
  if (IMAGE_EXTS.includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  return "other";
}

function saveBlobUrl(url, name) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name || "piece-jointe";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// Renders a chat attachment: inline thumbnail for images, a file chip for the
// rest. Images open in a lightbox; PDFs open in an in-app iframe preview. Files
// are fetched through the auth-gated endpoint (never a public URL).
export default function MessageAttachment({ conversationId, message, mine }) {
  const name = message.attachment_name;
  const kind = classify(name);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Images load right away (inline thumbnail); PDFs load when previewed.
  const { data: url } = useAttachmentUrl(
    conversationId,
    message.id,
    kind === "image" || previewOpen,
  );

  const download = async () => {
    try {
      if (url) {
        saveBlobUrl(url, name);
        return;
      }
      const blob = await messagingApi.downloadAttachment(conversationId, message.id);
      const temp = URL.createObjectURL(blob);
      saveBlobUrl(temp, name);
      URL.revokeObjectURL(temp);
    } catch (e) {
      toast.error(errorMessage(e, "Le téléchargement a échoué."));
    }
  };

  // Hands the (already-fetched) file to the browser/OS, which renders it or
  // offers an "open with" / download choice. Triggered from a button click with
  // the blob ready, so mobile popup blockers don't kill it.
  const openInNewTab = () => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const inline =
    kind === "image" ? (
      url ? (
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="block overflow-hidden rounded-lg"
          aria-label={`Agrandir ${name}`}
        >
          <img src={url} alt={name} className="max-h-52 max-w-full rounded-lg object-cover" />
        </button>
      ) : (
        <div className="h-40 w-56 max-w-full animate-pulse rounded-lg bg-foreground/10" />
      )
    ) : (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs",
          mine ? "bg-primary-foreground/15" : "bg-background",
        )}
      >
        {kind === "pdf" ? (
          <FileText className="size-4 shrink-0" />
        ) : (
          <Paperclip className="size-4 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate">{name}</p>
          {message.attachment_size != null && (
            <p className="opacity-70">{formatBytes(message.attachment_size)}</p>
          )}
        </div>
        {kind === "pdf" && (
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            aria-label="Aperçu"
            className="rounded p-1 hover:bg-foreground/10"
          >
            <Eye className="size-4" />
          </button>
        )}
        <button
          type="button"
          onClick={download}
          aria-label="Télécharger"
          className="rounded p-1 hover:bg-foreground/10"
        >
          <Download className="size-4" />
        </button>
      </div>
    );

  return (
    <>
      {inline}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-8 text-base">{name}</DialogTitle>
            <DialogDescription className="sr-only">Aperçu de la pièce jointe</DialogDescription>
          </DialogHeader>

          <div className="flex min-h-[60vh] items-center justify-center">
            {!url ? (
              <Spinner />
            ) : kind === "image" ? (
              <img
                src={url}
                alt={name}
                className="max-h-[70vh] max-w-full rounded-lg object-contain"
              />
            ) : CAN_INLINE_PDF ? (
              <iframe src={url} title={name} className="h-[70vh] w-full rounded-lg border" />
            ) : (
              <div className="max-w-sm px-4 py-10 text-center">
                <FileText className="mx-auto size-10 text-muted-foreground" />
                <p className="mt-4 text-sm text-foreground">
                  L'aperçu du PDF n'est pas pris en charge par ce navigateur.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ouvrez le fichier dans un nouvel onglet ou téléchargez-le.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            {kind === "pdf" && (
              <Button variant="outline" onClick={openInNewTab} disabled={!url}>
                Ouvrir dans un nouvel onglet
              </Button>
            )}
            <Button variant="outline" onClick={download}>
              <Download className="size-4" /> Télécharger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
