from django.conf import settings
from django.contrib import admin
from django.http import HttpResponse
from django.urls import include, path, re_path
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
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
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
