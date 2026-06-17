from django.urls import path

from .views import my_favorites, toggle_favorite

urlpatterns = [
    path("favorites/", my_favorites, name="favorites-list"),
    path("favorites/toggle/", toggle_favorite, name="favorites-toggle"),
]
