import os

from django.contrib.auth import get_user_model
from django.db.models import F, Max, Q
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.common.permissions import IsEmailVerified
from apps.common.throttles import MessageThrottle
from apps.common.uploads import CHAT_ATTACHMENT_RULES, upload_error
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
    # Safe methods stay open (unverified users can read threads); creating a
    # conversation or sending a message (POST) requires a verified email.
    permission_classes = [IsAuthenticated, IsEmailVerified]

    def get_queryset(self):
        user = self.request.user
        return (
            Conversation.objects.filter(Q(user_low=user) | Q(user_high=user))
            .select_related("user_low", "user_high", "order")
            .annotate(last_at=Max("messages__created_at"))
            .order_by(F("last_at").desc(nulls_last=True), "-created_at")
        )

    def get_throttles(self):
        # Only rate-limit the write paths (starting a conversation with an
        # initial message, or sending one). Reads — listing, opening a thread,
        # downloading an attachment — stay unthrottled so browsing is never blocked.
        sending = self.action == "create" or (
            self.action == "messages" and self.request.method == "POST"
        )
        return [MessageThrottle()] if sending else super().get_throttles()

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
        attachment = request.FILES.get("attachment")
        if not body and not attachment:
            return Response(
                {"detail": "Le message ne peut pas être vide."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if attachment:
            error = upload_error(attachment, CHAT_ATTACHMENT_RULES)
            if error:
                return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)
        message = post_message(conversation, request.user, body, attachment=attachment)
        return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)

    @action(
        detail=True,
        methods=("get",),
        url_path=r"messages/(?P<message_id>[^/.]+)/download",
    )
    def download_attachment(self, request, pk=None, message_id=None):
        # get_object() restricts to the user's own conversations, so a
        # non-participant gets a 404 here.
        conversation = self.get_object()
        message = get_object_or_404(conversation.messages, pk=message_id)
        if not message.attachment:
            return Response(
                {"detail": "Aucune pièce jointe."}, status=status.HTTP_404_NOT_FOUND
            )
        return FileResponse(
            message.attachment.open("rb"),
            as_attachment=True,
            filename=os.path.basename(message.attachment.name),
        )
