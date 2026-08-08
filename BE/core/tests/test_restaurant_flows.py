from datetime import timedelta

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from core.models import AvailabilitySlot, Restaurant, Table

pytestmark = pytest.mark.django_db


@pytest.fixture
def api_client():
    return APIClient()


def auth_as(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


def test_owner_creates_restaurant(api_client, owner):
    auth_as(api_client, owner)

    response = api_client.post(reverse('restaurant-list'), {
        'name': "Owner's Bistro",
        'address_line1': '1 Main St',
        'city': 'Springfield',
        'state': 'IL',
        'postal_code': '62701',
    })

    assert response.status_code == 201, response.data
    restaurant = Restaurant.objects.get(id=response.data['id'])
    assert restaurant.owner == owner


def test_owner_only_sees_their_own_restaurants(api_client, owner, diner, restaurant):
    other_restaurant = Restaurant.objects.create(
        owner=diner,
        name="Diner's Place",
        address_line1='2 Main St',
        city='Springfield',
        state='IL',
        postal_code='62701',
    )

    auth_as(api_client, owner)
    response = api_client.get(reverse('restaurant-list'))

    ids = {r['id'] for r in response.data['results']} if 'results' in response.data else {r['id'] for r in response.data}
    assert restaurant.id in ids
    assert other_restaurant.id not in ids


def test_cannot_create_table_for_someone_elses_restaurant(api_client, diner, restaurant):
    auth_as(api_client, diner)

    response = api_client.post(reverse('table-list'), {
        'restaurant': restaurant.id,
        'table_number': '1',
        'capacity': 4,
    })

    assert response.status_code == 400
    assert 'restaurant' in response.data


def test_owner_creates_table_for_their_restaurant(api_client, owner, restaurant):
    auth_as(api_client, owner)

    response = api_client.post(reverse('table-list'), {
        'restaurant': restaurant.id,
        'table_number': '2',
        'capacity': 2,
    })

    assert response.status_code == 201, response.data
    assert Table.objects.filter(restaurant=restaurant, table_number='2').exists()


def test_non_owner_cannot_update_or_delete_a_table(api_client, diner, table):
    auth_as(api_client, diner)
    url = reverse('table-detail', args=[table.id])

    assert api_client.patch(url, {'capacity': 10}).status_code == 404
    assert api_client.delete(url).status_code == 404


def test_slot_requires_end_after_start(api_client, owner, table):
    auth_as(api_client, owner)
    start = timezone.now() + timedelta(hours=1)

    response = api_client.post(reverse('availabilityslot-list'), {
        'table': table.id,
        'start_time': start.isoformat(),
        'end_time': start.isoformat(),
        'credit_value': '50.00',
        'prepay_price': '30.00',
    })

    assert response.status_code == 400
    assert 'end_time' in response.data


def test_slot_requires_prepay_price_below_credit_value(api_client, owner, table):
    auth_as(api_client, owner)
    start = timezone.now() + timedelta(hours=1)

    response = api_client.post(reverse('availabilityslot-list'), {
        'table': table.id,
        'start_time': start.isoformat(),
        'end_time': (start + timedelta(hours=1)).isoformat(),
        'credit_value': '30.00',
        'prepay_price': '30.00',
    })

    assert response.status_code == 400
    assert 'prepay_price' in response.data


def test_owner_creates_a_valid_slot(api_client, owner, table):
    auth_as(api_client, owner)
    start = timezone.now() + timedelta(hours=1)

    response = api_client.post(reverse('availabilityslot-list'), {
        'table': table.id,
        'start_time': start.isoformat(),
        'end_time': (start + timedelta(hours=1)).isoformat(),
        'credit_value': '50.00',
        'prepay_price': '30.00',
    })

    assert response.status_code == 201, response.data
    slot = AvailabilitySlot.objects.get(id=response.data['id'])
    assert slot.status == AvailabilitySlot.Status.OPEN
