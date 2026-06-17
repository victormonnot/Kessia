"""Shared validation for user file uploads: size cap + extension allowlist.

Single source of truth for every upload surface (chat attachments, order
deliverables, verification documents) so the rules can't drift apart.
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


def upload_error(upload, rules: tuple[int, set[str]]) -> str | None:
    """Return a French error message if the upload breaks the rules, else None."""
    max_mb, allowed_exts = rules
    ext = os.path.splitext(upload.name)[1].lower()
    if ext not in allowed_exts:
        return "Type de fichier non autorisé."
    if upload.size > max_mb * 1024 * 1024:
        return f"Le fichier dépasse la taille maximale de {max_mb} Mo."
    return None
