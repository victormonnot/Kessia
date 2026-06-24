"""Production must fail fast on a public/placeholder SECRET_KEY (F4)."""

import pytest
from django.core.exceptions import ImproperlyConfigured

from config.settings.base import ensure_strong_secret_key


def test_rejects_placeholder_secret_keys():
    for bad in ("", "insecure-dev-key-change-me", "change-me-in-production"):
        with pytest.raises(ImproperlyConfigured):
            ensure_strong_secret_key(bad)


def test_accepts_a_real_secret_key():
    # A strong, non-placeholder value must not raise.
    ensure_strong_secret_key("k9$2zQ-very-long-random-production-secret-0987654321")
