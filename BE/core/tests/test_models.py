import pytest
from django.db import IntegrityError

from core.models import Reservation

pytestmark = pytest.mark.django_db


def test_a_slot_can_only_have_one_reservation(slot, diner, reservation):
    with pytest.raises(IntegrityError):
        Reservation.objects.create(
            slot=slot,
            diner=diner,
            party_size=1,
            amount_paid='30.00',
        )
