import uuid

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class Restaurant(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='restaurants',
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    cuisine_type = models.CharField(max_length=100, blank=True)

    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    timezone = models.CharField(max_length=64, default='UTC')

    phone_number = models.CharField(max_length=32, blank=True)
    email = models.EmailField(blank=True)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Table(models.Model):
    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name='tables',
    )
    table_number = models.CharField(max_length=20)
    capacity = models.PositiveSmallIntegerField(validators=[MinValueValidator(1)])
    location_description = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['restaurant', 'table_number']
        unique_together = ('restaurant', 'table_number')

    def __str__(self):
        return f'{self.restaurant.name} - Table {self.table_number}'


class AvailabilitySlot(models.Model):
    class Status(models.TextChoices):
        OPEN = 'open', 'Open'
        RESERVED = 'reserved', 'Reserved'
        EXPIRED = 'expired', 'Expired'
        FULFILLED = 'fulfilled', 'Fulfilled'
        CANCELLED = 'cancelled', 'Cancelled'

    table = models.ForeignKey(
        Table,
        on_delete=models.CASCADE,
        related_name='availability_slots',
    )
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    credit_value = models.DecimalField(
        max_digits=8, decimal_places=2,
        help_text='Face value of the dining credit (e.g. $50.00).',
    )
    prepay_price = models.DecimalField(
        max_digits=8, decimal_places=2,
        help_text='Discounted amount the diner prepays (e.g. $30.00).',
    )

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_time']
        indexes = [
            models.Index(fields=['status', 'start_time']),
        ]

    def __str__(self):
        return f'{self.table} @ {self.start_time:%Y-%m-%d %H:%M} ({self.status})'


class Reservation(models.Model):
    class Status(models.TextChoices):
        PENDING_PAYMENT = 'pending_payment', 'Pending Payment'
        CONFIRMED = 'confirmed', 'Confirmed'
        CANCELLED = 'cancelled', 'Cancelled'
        COMPLETED = 'completed', 'Completed'
        NO_SHOW = 'no_show', 'No Show'

    slot = models.OneToOneField(
        AvailabilitySlot,
        on_delete=models.CASCADE,
        related_name='reservation',
    )
    diner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reservations',
    )
    party_size = models.PositiveSmallIntegerField(validators=[MinValueValidator(1)])

    confirmation_code = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING_PAYMENT)

    amount_paid = models.DecimalField(max_digits=8, decimal_places=2)
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Reservation {self.confirmation_code} ({self.status})'
