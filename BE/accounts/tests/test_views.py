from unittest.mock import patch

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from accounts.models import User

pytestmark = pytest.mark.django_db


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def google_payload():
    return {
        'sub': 'google-sub-123',
        'email': 'new.diner@example.com',
        'given_name': 'New',
        'family_name': 'Diner',
        'picture': 'https://example.com/avatar.png',
    }


@patch('accounts.views.google_id_token.verify_oauth2_token')
def test_creates_a_new_user_with_no_usable_password(mock_verify, api_client, google_payload):
    mock_verify.return_value = google_payload

    response = api_client.post(reverse('google_login'), {'id_token': 'fake-token'})

    assert response.status_code == 200
    assert 'access' in response.data
    assert 'refresh' in response.data

    user = User.objects.get(google_sub='google-sub-123')
    assert user.email == 'new.diner@example.com'
    assert not user.has_usable_password()


@patch('accounts.views.google_id_token.verify_oauth2_token')
def test_reuses_existing_user_on_repeat_login(mock_verify, api_client, google_payload):
    mock_verify.return_value = google_payload
    api_client.post(reverse('google_login'), {'id_token': 'fake-token'})

    api_client.post(reverse('google_login'), {'id_token': 'fake-token'})

    assert User.objects.filter(google_sub='google-sub-123').count() == 1


@patch('accounts.views.google_id_token.verify_oauth2_token')
def test_invalid_token_returns_401(mock_verify, api_client):
    mock_verify.side_effect = ValueError('invalid token')

    response = api_client.post(reverse('google_login'), {'id_token': 'bad-token'})

    assert response.status_code == 401
