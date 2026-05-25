from datetime import date, timedelta
from decimal import Decimal

import factory

from apps.common.choices import Specialty
from apps.requests_board.models import Proposal, Request
from apps.users.tests.factories import UserFactory, WriterFactory


class RequestFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Request

    doctor = factory.SubFactory(UserFactory)
    title = factory.Sequence(lambda n: f"Request {n}")
    description = "Help me write this."
    specialty = Specialty.CARDIOLOGY
    deadline = factory.LazyFunction(lambda: date.today() + timedelta(days=30))
    budget = Decimal("500.00")
    status = Request.Status.OPEN


class ProposalFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Proposal

    request = factory.SubFactory(RequestFactory)
    writer = factory.SubFactory(WriterFactory)
    message = "I can do it."
    price = Decimal("450.00")
    status = Proposal.Status.PENDING
