import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

from apps.users.models import User


@pytest.fixture(autouse=True)
def _isolate_throttle_state():
    """Throttle counters live in the cache, which (unlike the DB) persists
    across tests in a process. Clear it so each test starts unthrottled."""
    cache.clear()
    yield


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


# Default fixtures represent fully-onboarded (email-verified) users, since most
# tests exercise actions that now require a verified email. Use the explicit
# `unverified_*` fixtures below to test the gating itself.
@pytest.fixture
def user(db) -> User:
    return User.objects.create_user(
        email="doctor@example.com",
        password="testpass123",
        first_name="Doc",
        last_name="Tor",
        is_email_verified=True,
    )


@pytest.fixture
def writer_user(db) -> User:
    return User.objects.create_user(
        email="writer@example.com",
        password="testpass123",
        first_name="Write",
        last_name="R",
        is_writer=True,
        is_email_verified=True,
    )


@pytest.fixture
def other_writer_user(db) -> User:
    return User.objects.create_user(
        email="writer2@example.com",
        password="testpass123",
        first_name="Other",
        last_name="Writer",
        is_writer=True,
        is_email_verified=True,
    )


@pytest.fixture
def unverified_user(db) -> User:
    """An email-unverified writer, for testing the verification gate."""
    return User.objects.create_user(
        email="unverified@example.com",
        password="testpass123",
        first_name="Un",
        last_name="Verified",
        is_writer=True,
    )


def _auth(client: APIClient, user: User) -> APIClient:
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def auth_client(api_client: APIClient, user: User) -> APIClient:
    return _auth(api_client, user)


@pytest.fixture
def writer_auth_client(api_client: APIClient, writer_user: User) -> APIClient:
    return _auth(api_client, writer_user)


@pytest.fixture
def other_writer_auth_client(writer_user: User, other_writer_user: User) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=other_writer_user)
    return client


@pytest.fixture
def unverified_client(api_client: APIClient, unverified_user: User) -> APIClient:
    return _auth(api_client, unverified_user)
