"""Upload validation: the magic-byte content check rejects files whose real
bytes don't match their extension, while every legitimate type still passes (F10)."""

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.common.uploads import (
    CHAT_ATTACHMENT_RULES,
    DELIVERABLE_RULES,
    VERIFICATION_DOC_RULES,
    upload_error,
)

# Minimal but real leading bytes for each recognised kind.
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 32
GIF = b"GIF89a" + b"\x00" * 32
WEBP = b"RIFF\x00\x00\x00\x00WEBP" + b"\x00" * 32
ZIP = b"PK\x03\x04" + b"\x00" * 32
OLE = b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1" + b"\x00" * 32
PDF = b"%PDF-1.7\n" + b"\x00" * 32
TEXT = b"name,score\nfoo,1\n"


def _upload(name, content):
    return SimpleUploadedFile(name, content)


@pytest.mark.parametrize(
    ("name", "content"),
    [
        ("paper.pdf", PDF),
        ("scan.png", PNG),
        ("scan.jpg", JPEG),
        ("scan.jpeg", JPEG),
        ("anim.gif", GIF),
        ("photo.webp", WEBP),
        ("sheet.xlsx", ZIP),
        ("brief.docx", ZIP),
        ("notes.odt", ZIP),
        ("legacy.doc", OLE),
        ("legacy.xls", OLE),
        ("notes.txt", TEXT),
        ("data.csv", TEXT),
        ("bundle.zip", ZIP),
    ],
)
def test_legitimate_files_pass(name, content):
    # Every allowed type with matching content is accepted (no false rejections).
    assert upload_error(_upload(name, content), CHAT_ATTACHMENT_RULES) is None


def test_executable_renamed_to_pdf_is_rejected():
    # The core F10 case: real content (a PE/EXE) disguised with an allowed ext.
    bad = _upload("report.pdf", b"MZ\x90\x00" + b"\x00" * 64)
    assert upload_error(bad, DELIVERABLE_RULES) is not None


def test_html_renamed_to_png_is_rejected():
    bad = _upload("avatar.png", b"<!DOCTYPE html><script>alert(1)</script>")
    assert upload_error(bad, CHAT_ATTACHMENT_RULES) is not None


def test_zip_cannot_masquerade_as_pdf():
    # Document/archive kinds must match exactly: a zip named .pdf is rejected.
    bad = _upload("archive.pdf", ZIP)
    assert upload_error(bad, DELIVERABLE_RULES) is not None


def test_image_family_is_lenient_about_extension():
    # A real PNG saved as .jpg is harmless and common — it must still pass.
    assert upload_error(_upload("photo.jpg", PNG), CHAT_ATTACHMENT_RULES) is None


def test_content_check_rewinds_file_for_saving():
    # upload_error reads the header; the file pointer must be reset to 0 so the
    # caller saves the whole file, not a truncated one.
    upload = _upload("paper.pdf", PDF)
    upload_error(upload, DELIVERABLE_RULES)
    assert upload.read() == PDF


def test_extension_and_size_checks_still_apply():
    assert upload_error(_upload("malware.exe", b"MZ"), CHAT_ATTACHMENT_RULES) is not None
    huge = _upload("big.pdf", PDF + b"\x00" * (10 * 1024 * 1024))
    assert upload_error(huge, VERIFICATION_DOC_RULES) is not None
