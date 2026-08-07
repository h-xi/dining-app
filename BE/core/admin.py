from django.contrib import admin

from .models import AvailabilitySlot, Reservation, Restaurant, Table


@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'city', 'is_active')
    search_fields = ('name', 'city')
    list_filter = ('is_active', 'city')


@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ('restaurant', 'table_number', 'capacity', 'is_active')
    list_filter = ('restaurant', 'is_active')


@admin.register(AvailabilitySlot)
class AvailabilitySlotAdmin(admin.ModelAdmin):
    list_display = ('table', 'start_time', 'end_time', 'status', 'prepay_price', 'credit_value')
    list_filter = ('status',)
    date_hierarchy = 'start_time'


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ('confirmation_code', 'diner', 'slot', 'status', 'amount_paid')
    list_filter = ('status',)
    search_fields = ('confirmation_code', 'diner__username', 'diner__email')
