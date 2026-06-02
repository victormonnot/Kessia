from django_filters import rest_framework as filters

from .models import Listing


class ListingFilter(filters.FilterSet):
    # `?mine=true` restricts to the authenticated writer's own listings.
    mine = filters.BooleanFilter(method="filter_mine")
    price_min = filters.NumberFilter(field_name="price", lookup_expr="gte")
    price_max = filters.NumberFilter(field_name="price", lookup_expr="lte")
    turnaround_max = filters.NumberFilter(field_name="turnaround_days", lookup_expr="lte")
    # Minimum writer rating; filters on the `writer_rating` annotation added by
    # ListingViewSet (a HAVING clause on the aggregate).
    rating_min = filters.NumberFilter(method="filter_rating_min")

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

    def filter_rating_min(self, queryset, name, value):
        return queryset.filter(writer_rating__gte=value)
