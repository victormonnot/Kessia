from rest_framework import mixins, status, viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.common.permissions import IsEmailVerified
from apps.listings.permissions import IsWriter

from .models import VerificationRequest
from .serializers import (
    VerificationRequestCreateSerializer,
    VerificationRequestSerializer,
)


class VerificationViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    # JSON for credential-only requests; multipart when a document is attached.
    parser_classes = (JSONParser, MultiPartParser, FormParser)

    def get_queryset(self):
        return VerificationRequest.objects.filter(writer=self.request.user)

    def get_serializer_class(self):
        if self.action == "create":
            return VerificationRequestCreateSerializer
        return VerificationRequestSerializer

    def get_permissions(self):
        if self.action == "create":
            return [IsAuthenticated(), IsEmailVerified(), IsWriter()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(
            VerificationRequestSerializer(instance).data,
            status=status.HTTP_201_CREATED,
        )
