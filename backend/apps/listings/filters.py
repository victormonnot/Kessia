from django_filters import rest_framework as filters

from .models import Listing


class ListingFilter(filters.FilterSet):
    class Meta:
        model = Listing
        fields = {
            "specialty": ("exact",),
            "deliverable_type": ("exact",),
            "is_published": ("exact",),
        }
