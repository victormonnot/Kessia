from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.listings.permissions import IsWriter

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
    filterset_fields = ("specialty", "status")
    search_fields = ("title", "description")
    ordering_fields = ("created_at", "deadline", "budget")
    ordering = ("-created_at",)

    def get_queryset(self):
        qs = Request.objects.select_related("doctor").annotate(
            proposals_count=Count("proposals")
        )
        # `?mine=true` restricts to the authenticated doctor's own requests.
        if self.request.query_params.get("mine") in ("true", "1"):
            user = self.request.user
            if user.is_authenticated:
                qs = qs.filter(doctor=user)
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
            return [IsAuthenticated()]
        if self.action in {"update", "partial_update", "destroy"}:
            return [IsAuthenticated(), IsRequestOwner()]
        return [IsAuthenticated()]

    @action(
        detail=True,
        methods=("get", "post"),
        url_path="proposals",
        permission_classes=(IsAuthenticated,),
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
            return [IsAuthenticated(), IsWriter(), IsProposalWriter()]
        # update / partial_update
        return [IsAuthenticated(), IsProposalRequestOwner()]

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


def get_proposal_or_404(pk):
    return get_object_or_404(Proposal, pk=pk)
