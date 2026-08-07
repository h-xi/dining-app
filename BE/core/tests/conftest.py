from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone

from core.models import AvailabilitySlot, Reservation, Restaurant, Table

User = get_user_model()


@pytest.fixture
def diner(db):
    user = User.objects.create_user(username='diner', email='diner@example.com', google_sub='diner-sub')
    user.set_unusable_password()
    user.save(update_fields=['password'])
    return user


@pytest.fixture
def owner(db):
    user = User.objects.create_user(username='owner', email='owner@example.com', google_sub='owner-sub')
    user.set_unusable_password()
    user.save(update_fields=['password'])
    return user


@pytest.fixture
def restaurant(owner):
    return Restaurant.objects.create(
        owner=owner,
        name='Test Restaurant',
        address_line1='123 Main St',
        city='Springfield',
        state='IL',
        postal_code='62701',
    )


@pytest.fixture
def table(restaurant):
    return Table.objects.create(restaurant=restaurant, table_number='1', capacity=4)


@pytest.fixture
def slot(table):
    return AvailabilitySlot.objects.create(
        table=table,
        start_time=timezone.now() + timedelta(hours=1),
        end_time=timezone.now() + timedelta(hours=2),
        credit_value='50.00',
        prepay_price='30.00',
    )


@pytest.fixture
def reservation(slot, diner):
    return Reservation.objects.create(
        slot=slot,
        diner=diner,
        party_size=2,
        amount_paid='30.00',
    )
