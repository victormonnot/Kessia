import re

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import HttpResponse
from django.urls import include, path, re_path
from django.views.static import serve
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("apps.users.urls")),
    path("api/v1/", include("apps.listings.urls")),
    path("api/v1/", include("apps.orders.urls")),
    path("api/v1/", include("apps.requests_board.urls")),
    path("api/v1/", include("apps.payments.urls")),
    path("api/v1/", include("apps.reviews.urls")),
    path("api/v1/", include("apps.messaging.urls")),
    path("api/v1/", include("apps.verification.urls")),
    path("api/v1/", include("apps.favorites.urls")),
    path("api/v1/", include("apps.admin_panel.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
]

# Serve uploaded media (avatars, etc.) through Django. In prod, S3
# (django-storages) normally builds the URLs — but a bucket-less demo
# (SERVE_MEDIA) has no S3, so we serve /media ourselves, mirroring what Django's
# static() helper does (it no-ops when DEBUG is False).
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
elif getattr(settings, "SERVE_MEDIA", False):
    urlpatterns += [
        re_path(
            r"^%s(?P<path>.*)$" % re.escape(settings.MEDIA_URL.lstrip("/")),
            serve,
            {"document_root": settings.MEDIA_ROOT},
        ),
    ]

# Single-origin prod: WhiteNoise serves the SPA's files (index, /assets/…); this
# catch-all returns index.html for client-side routes (e.g. /dashboard/writer).
if getattr(settings, "SERVE_SPA", False):

    def spa_index(_request):
        index = settings.WHITENOISE_ROOT / "index.html"
        return HttpResponse(index.read_bytes(), content_type="text/html")

    urlpatterns += [
        re_path(r"^(?!api/|admin/|static/|media/).*$", spa_index),
    ]
