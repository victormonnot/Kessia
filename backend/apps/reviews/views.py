from rest_framework import mixins, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.common.permissions import IsEmailVerified

from .models import Review
from .serializers import ReviewCreateSerializer, ReviewSerializer


class ReviewViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    def get_queryset(self):
        qs = Review.objects.select_related("doctor", "writer", "order")
        writer_id = self.request.query_params.get("writer")
        if writer_id:
            qs = qs.filter(writer_id=writer_id)
        return qs

    def get_serializer_class(self):
        if self.action == "create":
            return ReviewCreateSerializer
        return ReviewSerializer

    def get_permissions(self):
        if self.action == "create":
            return [IsAuthenticated(), IsEmailVerified()]
        return [AllowAny()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = serializer.save()
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)
