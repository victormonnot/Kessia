from decimal import Decimal

import factory

from apps.common.choices import DeliverableType, Specialty
from apps.listings.models import Listing
from apps.users.tests.factories import WriterFactory


class ListingFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Listing

    writer = factory.SubFactory(WriterFactory)
    title = factory.Sequence(lambda n: f"Listing {n}")
    description = "A medical writing service."
    specialty = Specialty.CARDIOLOGY
    deliverable_type = DeliverableType.RESEARCH_PAPER
    price = Decimal("250.00")
    turnaround_days = 7
    is_published = True
