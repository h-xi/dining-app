import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from accounts.models import User

pytestmark = pytest.mark.django_db


@pytest.fixture
def api_client():
    return APIClient()


def test_register_creates_a_new_user(api_client):
    response = api_client.post(reverse('register'), {
        'email': 'new.diner@example.com',
        'password': 'a-strong-password-123',
        'first_name': 'New',
        'last_name': 'Diner',
    })

    assert response.status_code == 200
    assert 'access' in response.data
    assert 'refresh' in response.data

    user = User.objects.get(email='new.diner@example.com')
    assert user.check_password('a-strong-password-123')


def test_register_rejects_duplicate_email(api_client):
    User.objects.create_user(username='existing', email='dup@example.com', password='a-strong-password-123')

    response = api_client.post(reverse('register'), {
        'email': 'dup@example.com',
        'password': 'a-strong-password-123',
    })

    assert response.status_code == 400


def test_login_with_correct_credentials(api_client):
    User.objects.create_user(username='owner', email='owner@example.com', password='a-strong-password-123')

    response = api_client.post(reverse('login'), {
        'email': 'owner@example.com',
        'password': 'a-strong-password-123',
    })

    assert response.status_code == 200
    assert 'access' in response.data


def test_login_with_wrong_password_returns_400(api_client):
    User.objects.create_user(username='owner', email='owner@example.com', password='a-strong-password-123')

    response = api_client.post(reverse('login'), {
        'email': 'owner@example.com',
        'password': 'wrong-password',
    })

    assert response.status_code == 400
