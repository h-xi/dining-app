from datetime import timedelta

import pytest
from django.utils import timezone

from core.models import AvailabilitySlot
from core.tasks import expire_availability_slots

pytestmark = pytest.mark.django_db


def test_expires_open_slots_in_the_past(slot):
    slot.start_time = timezone.now() - timedelta(hours=1)
    slot.end_time = timezone.now() - timedelta(minutes=30)
    slot.status = AvailabilitySlot.Status.OPEN
    slot.save()

    expire_availability_slots()

    slot.refresh_from_db()
    assert slot.status == AvailabilitySlot.Status.EXPIRED


def test_does_not_expire_future_slots(slot):
    expire_availability_slots()

    slot.refresh_from_db()
    assert slot.status == AvailabilitySlot.Status.OPEN


def test_does_not_touch_non_open_slots_in_the_past(slot):
    slot.start_time = timezone.now() - timedelta(hours=1)
    slot.status = AvailabilitySlot.Status.RESERVED
    slot.save()

    expire_availability_slots()

    slot.refresh_from_db()
    assert slot.status == AvailabilitySlot.Status.RESERVED
