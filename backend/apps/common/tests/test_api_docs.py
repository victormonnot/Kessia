"""The OpenAPI schema + Swagger UI are reconnaissance surface, so they are gated
behind ENABLE_API_DOCS (off by default, incl. prod). See config/urls.py (F9)."""

from importlib import import_module, reload

import pytest
from django.conf import settings
from django.test import override_settings
from django.urls import clear_url_caches


def _reload_urlconf():
    """Conditional URL inclusion is evaluated at import time, so flipping the
    setting in a test requires rebuilding the URL resolver from the urlconf."""
    clear_url_caches()
    reload(import_module(settings.ROOT_URLCONF))


@pytest.mark.django_db
def test_api_docs_hidden_when_disabled(client):
    # Test settings default ENABLE_API_DOCS off, matching production.
    assert client.get("/api/schema/").status_code == 404
    assert client.get("/api/docs/").status_code == 404


@pytest.mark.django_db
def test_api_docs_served_when_enabled(client):
    with override_settings(ENABLE_API_DOCS=True):
        _reload_urlconf()
        assert client.get("/api/schema/").status_code == 200
        assert client.get("/api/docs/").status_code == 200
    # Restore the default-off urlconf so later tests see the gated routes.
    _reload_urlconf()
