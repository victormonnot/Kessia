from django_filters import rest_framework as filters

from .models import Request


class RequestFilter(filters.FilterSet):
    # `?mine=true` restricts to the authenticated doctor's own requests.
    mine = filters.BooleanFilter(method="filter_mine")
    budget_min = filters.NumberFilter(field_name="budget", lookup_expr="gte")
    budget_max = filters.NumberFilter(field_name="budget", lookup_expr="lte")
    deadline_before = filters.DateFilter(field_name="deadline", lookup_expr="lte")

    class Meta:
        model = Request
        fields = {
            "specialty": ("exact",),
            "status": ("exact",),
        }

    def filter_mine(self, queryset, name, value):
        user = getattr(self.request, "user", None)
        if value and user and user.is_authenticated:
            return queryset.filter(doctor=user)
        return queryset
