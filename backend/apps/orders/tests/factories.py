import factory

from apps.listings.tests.factories import ListingFactory
from apps.orders.models import Order
from apps.users.tests.factories import UserFactory


class OrderFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Order

    listing = factory.SubFactory(ListingFactory)
    doctor = factory.SubFactory(UserFactory)
    status = Order.Status.PENDING
    message = "Please write my paper."
