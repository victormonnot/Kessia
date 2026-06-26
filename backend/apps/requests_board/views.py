from django.db.models import Count, Exists, OuterRef, Q
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.common.permissions import IsEmailVerified
from apps.listings.permissions import IsWriter

from .filters import RequestFilter
from .models import Proposal, Request
from .permissions import (
    IsProposalRequestOwner,
    IsProposalWriter,
    IsRequestOwner,
)
from .serializers import (
    ProposalCreateSerializer,
    ProposalSerializer,
    ProposalUpdateSerializer,
    RequestDetailSerializer,
    RequestListSerializer,
    RequestWriteSerializer,
)
from .services import accept_proposal, notify_new_proposal, notify_proposal_accepted


class RequestViewSet(viewsets.ModelViewSet):
    filterset_class = RequestFilter
    search_fields = ("title", "description")
    ordering_fields = ("created_at", "deadline", "budget")
    ordering = ("-created_at",)

    def get_queryset(self):
        qs = (
            Request.objects.select_related("doctor")
            .filter(removed_at__isnull=True)  # hide admin-removed requests
            .annotate(proposals_count=Count("proposals"))
        )
        user = self.request.user
        if user.is_authenticated:
            from apps.favorites.models import Favorite

            qs = qs.annotate(
                is_favorited=Exists(
                    Favorite.objects.filter(user=user, request=OuterRef("pk"))
                )
            )
        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return RequestListSerializer
        if self.action in {"create", "update", "partial_update"}:
            return RequestWriteSerializer
        return RequestDetailSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [AllowAny()]
        if self.action == "create":
            return [IsAuthenticated(), IsEmailVerified()]
        if self.action in {"update", "partial_update", "destroy"}:
            return [IsAuthenticated(), IsEmailVerified(), IsRequestOwner()]
        return [IsAuthenticated()]

    @action(
        detail=True,
        methods=("get", "post"),
        url_path="proposals",
        permission_classes=(IsAuthenticated, IsEmailVerified),
    )
    def proposals(self, request, pk=None):
        request_obj = self.get_object()
        if request.method == "GET":
            qs = Proposal.objects.filter(request=request_obj).select_related("writer")
            if request_obj.doctor_id != request.user.id:
                qs = qs.filter(writer=request.user)
            return Response(ProposalSerializer(qs, many=True).data)

        # POST: writer creates a proposal
        if not request.user.is_writer:
            return Response(
                {"detail": "Only writers can submit proposals."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = ProposalCreateSerializer(
            data=request.data,
            context={"request": request, "request_obj": request_obj},
        )
        serializer.is_valid(raise_exception=True)
        proposal = serializer.save()
        notify_new_proposal(proposal)
        return Response(ProposalSerializer(proposal).data, status=status.HTTP_201_CREATED)


class ProposalViewSet(
    mixins.ListModelMixin,
    mixins.DestroyModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    http_method_names = ("get", "patch", "delete", "head", "options")
    ordering = ("-created_at",)

    def get_queryset(self):
        # Proposals the user is involved in: their own (as a writer) or those on
        # their requests (as a doctor). Powers both dashboard proposal tabs.
        user = self.request.user
        return (
            Proposal.objects.select_related("request", "request__doctor", "writer")
            .filter(Q(writer=user) | Q(request__doctor=user))
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        if self.action in {"update", "partial_update"}:
            return ProposalUpdateSerializer
        return ProposalSerializer

    def get_permissions(self):
        if self.action == "list":
            return [IsAuthenticated()]
        if self.action == "destroy":
            return [IsAuthenticated(), IsEmailVerified(), IsWriter(), IsProposalWriter()]
        # update / partial_update (accept / reject a proposal)
        return [IsAuthenticated(), IsEmailVerified(), IsProposalRequestOwner()]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data.get("status")
        if new_status == Proposal.Status.ACCEPTED:
            # Atomic: create the order, close the request, reject the others.
            accept_proposal(instance)
            instance.refresh_from_db()
            notify_proposal_accepted(instance)
        else:
            serializer.save()
            instance.refresh_from_db()
        return Response(ProposalSerializer(instance).data)
