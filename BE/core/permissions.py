from rest_framework.permissions import BasePermission

from .models import AvailabilitySlot, Restaurant, Table


class IsRestaurantOwner(BasePermission):
    message = "You don't own this restaurant."

    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Restaurant):
            return obj.owner_id == request.user.id
        if isinstance(obj, Table):
            return obj.restaurant.owner_id == request.user.id
        if isinstance(obj, AvailabilitySlot):
            return obj.table.restaurant.owner_id == request.user.id
        return False
