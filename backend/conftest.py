import pytest
from rest_framework.test import APIClient

from apps.users.models import User


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def user(db) -> User:
    return User.objects.create_user(
        email="doctor@example.com",
        password="testpass123",
        first_name="Doc",
        last_name="Tor",
    )


@pytest.fixture
def writer_user(db) -> User:
    return User.objects.create_user(
        email="writer@example.com",
        password="testpass123",
        first_name="Write",
        last_name="R",
        is_writer=True,
    )


@pytest.fixture
def other_writer_user(db) -> User:
    return User.objects.create_user(
        email="writer2@example.com",
        password="testpass123",
        first_name="Other",
        last_name="Writer",
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
