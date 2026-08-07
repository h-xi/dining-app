from celery import shared_task
from django.utils import timezone

from .models import AvailabilitySlot


@shared_task
def expire_availability_slots():
    updated = AvailabilitySlot.objects.filter(
        status=AvailabilitySlot.Status.OPEN,
        start_time__lt=timezone.now(),
    ).update(status=AvailabilitySlot.Status.EXPIRED)
    return updated
