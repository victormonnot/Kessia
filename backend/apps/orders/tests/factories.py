import factory

from apps.listings.tests.factories import ListingFactory
from apps.orders.models import Deliverable, Order
from apps.users.tests.factories import UserFactory


class OrderFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Order

    listing = factory.SubFactory(ListingFactory)
    doctor = factory.SubFactory(UserFactory)
    # By default an order mirrors its listing: the writer fulfilling it and the
    # snapshot amount come from the listing it was created from.
    writer = factory.LazyAttribute(lambda o: o.listing.writer if o.listing else None)
    amount = factory.LazyAttribute(
        lambda o: o.listing.price if o.listing else 0
    )
    status = Order.Status.PENDING
    message = "Please write my paper."


class DeliverableFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Deliverable

    order = factory.SubFactory(OrderFactory)
    file = factory.django.FileField(filename="deliverable.pdf", data=b"%PDF-1.4 test")
    note = ""
