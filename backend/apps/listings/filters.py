from django_filters import rest_framework as filters

from .models import Listing


class ListingFilter(filters.FilterSet):
    # `?mine=true` restricts to the authenticated writer's own listings.
    mine = filters.BooleanFilter(method="filter_mine")

    class Meta:
        model = Listing
        fields = {
            "specialty": ("exact",),
            "deliverable_type": ("exact",),
            "is_published": ("exact",),
        }

    def filter_mine(self, queryset, name, value):
        user = getattr(self.request, "user", None)
        if value and user and user.is_authenticated:
            return queryset.filter(writer=user)
        return queryset
