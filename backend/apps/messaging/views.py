from django.contrib.auth import get_user_model
from django.db.models import F, Max, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.orders.models import Order

from .models import Conversation
from .serializers import ConversationSerializer, MessageSerializer
from .services import get_or_create_conversation, post_message

User = get_user_model()


class ConversationViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = ConversationSerializer

    def get_queryset(self):
        user = self.request.user
        return (
            Conversation.objects.filter(Q(user_low=user) | Q(user_high=user))
            .select_related("user_low", "user_high", "order")
            .annotate(last_at=Max("messages__created_at"))
            .order_by(F("last_at").desc(nulls_last=True), "-created_at")
        )

    def create(self, request, *args, **kwargs):
        user = request.user
        body = (request.data.get("body") or "").strip()

        order = None
        order_id = request.data.get("order")
        if order_id:
            order = get_object_or_404(Order, pk=order_id)
            if user.id not in (order.doctor_id, order.writer_id):
                return Response(
                    {"detail": "Vous ne participez pas à cette commande."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            recipient = order.writer if user.id == order.doctor_id else order.doctor
        else:
            recipient_id = request.data.get("recipient")
            if not recipient_id:
                return Response(
                    {"detail": "Destinataire requis."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            recipient = get_object_or_404(User, pk=recipient_id)
            if recipient.id == user.id:
                return Response(
                    {"detail": "Vous ne pouvez pas vous écrire à vous-même."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        conversation = get_or_create_conversation(user, recipient, order=order)
        if body:
            post_message(conversation, user, body)
        return Response(
            ConversationSerializer(conversation, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=("get", "post"), url_path="messages")
    def messages(self, request, pk=None):
        conversation = self.get_object()

        if request.method == "GET":
            # Opening the thread marks the other party's messages as read.
            conversation.messages.filter(read_at__isnull=True).exclude(
                sender=request.user
            ).update(read_at=timezone.now())
            msgs = conversation.messages.select_related("sender").all()
            return Response(MessageSerializer(msgs, many=True).data)

        body = (request.data.get("body") or "").strip()
        if not body:
            return Response(
                {"detail": "Le message ne peut pas être vide."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        message = post_message(conversation, request.user, body)
        return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)
