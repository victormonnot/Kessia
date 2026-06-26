"""Shared validation for user file uploads: size cap + extension allowlist +
magic-byte content check.

Single source of truth for every upload surface (chat attachments, order
deliverables, verification documents) so the rules can't drift apart. The
content check (F10) defends against files whose real bytes don't match their
claimed extension — e.g. an executable or HTML page renamed to ``report.pdf``
to slip past an extension-only allowlist.
"""

from __future__ import annotations

import os

DOCUMENT_EXTS = {".pdf", ".doc", ".docx", ".odt", ".txt"}
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
SPREADSHEET_EXTS = {".csv", ".xls", ".xlsx"}
ARCHIVE_EXTS = {".zip"}

# Per-surface rules: (max size in MB, allowed extensions).
CHAT_ATTACHMENT_RULES = (10, DOCUMENT_EXTS | IMAGE_EXTS | SPREADSHEET_EXTS | ARCHIVE_EXTS)
# The finished work itself — generous cap (figure-heavy Word/PDF files).
DELIVERABLE_RULES = (25, DOCUMENT_EXTS | IMAGE_EXTS | SPREADSHEET_EXTS | ARCHIVE_EXTS)
# A scanned credential (diploma, certificate).
VERIFICATION_DOC_RULES = (10, DOCUMENT_EXTS | IMAGE_EXTS)

# --- Content (magic-byte) validation ---------------------------------------
# The extension is attacker-controlled, so we also confirm the file's leading
# bytes really are the type it claims. Images form one family (a real .png saved
# as .jpg is harmless and common, so any image kind satisfies any image ext),
# but a document/archive extension must match its true container — that stops a
# zip or HTML page from masquerading as a .pdf. The signature-less text formats
# (.txt/.csv) fall back to extension+size; they are served as downloads
# (Content-Disposition: attachment) so they can't be rendered as HTML anyway.

_IMAGE_KINDS = frozenset({"png", "jpeg", "gif", "webp"})
_EXT_KINDS: dict[str, frozenset[str]] = {
    ".pdf": frozenset({"pdf"}),
    ".png": _IMAGE_KINDS,
    ".jpg": _IMAGE_KINDS,
    ".jpeg": _IMAGE_KINDS,
    ".gif": _IMAGE_KINDS,
    ".webp": _IMAGE_KINDS,
    ".doc": frozenset({"ole"}),
    ".xls": frozenset({"ole"}),
    ".docx": frozenset({"zip"}),
    ".xlsx": frozenset({"zip"}),
    ".odt": frozenset({"zip"}),
    ".zip": frozenset({"zip"}),
    # .txt / .csv are plain text with no reliable signature — omitted on purpose
    # so they skip the content check.
}


def _detect_kind(header: bytes) -> str | None:
    """Best-effort file kind from the leading bytes; None if unrecognised."""
    if header.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if header.startswith(b"\xff\xd8\xff"):
        return "jpeg"
    if header.startswith((b"GIF87a", b"GIF89a")):
        return "gif"
    if header[:4] == b"RIFF" and header[8:12] == b"WEBP":
        return "webp"
    if header.startswith((b"PK\x03\x04", b"PK\x05\x06", b"PK\x07\x08")):
        return "zip"
    if header.startswith(b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1"):
        return "ole"
    if b"%PDF" in header[:1024]:  # some PDFs carry a few leading bytes
        return "pdf"
    return None


def upload_error(upload, rules: tuple[int, set[str]]) -> str | None:
    """Return a French error message if the upload breaks the rules, else None."""
    max_mb, allowed_exts = rules
    ext = os.path.splitext(upload.name)[1].lower()
    if ext not in allowed_exts:
        return "Type de fichier non autorisé."
    if upload.size > max_mb * 1024 * 1024:
        return f"Le fichier dépasse la taille maximale de {max_mb} Mo."
    expected = _EXT_KINDS.get(ext)
    if expected is not None:  # text types have no signature, so skip the check
        upload.seek(0)
        header = upload.read(1024)
        upload.seek(0)  # rewind so the file saves intact afterwards
        if _detect_kind(header) not in expected:
            return "Le contenu du fichier ne correspond pas à son extension."
    return None
