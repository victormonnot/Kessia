from unittest.mock import MagicMock

import pytest
from django.core import mail

from apps.common.notifications import NOTIFICATION_SUBJECTS, send_notification


def _rich_context():
    """A context that satisfies every email template (mocks fill any attribute)."""
    return {
        "order": MagicMock(),
        "proposal": MagicMock(),
        "conversation": MagicMock(),
        "user": MagicMock(),
        "reset_url": "https://kessia.test/reset-password?uid=x&token=y",
        "recipient_name": "Dr Dupont",
        "sender_name": "Alice Martin",
    }


@pytest.mark.parametrize("event", list(NOTIFICATION_SUBJECTS))
def test_every_event_renders_template_and_sends_one_email(event):
    """Guards the contract: every registered event has a working template and
    sends exactly one email with the right subject and recipient."""
    mail.outbox.clear()
    send_notification(event, "recipient@example.com", _rich_context())
    assert len(mail.outbox) == 1
    message = mail.outbox[0]
    assert message.to == ["recipient@example.com"]
    assert message.subject == NOTIFICATION_SUBJECTS[event]
    assert message.body.strip()  # rendered a non-empty body


def test_unknown_event_sends_nothing():
    mail.outbox.clear()
    send_notification("does_not_exist", "x@example.com", _rich_context())
    assert mail.outbox == []
