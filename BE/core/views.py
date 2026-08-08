from math import asin, cos, radians, sin, sqrt

from django.utils import timezone
from rest_framework import generics, permissions, viewsets
from rest_framework.response import Response

from .models import AvailabilitySlot, Restaurant, Table
from .permissions import IsRestaurantOwner
from .serializers import (
    AvailabilitySlotSerializer,
    BrowseAvailabilitySlotSerializer,
    RestaurantSerializer,
    TableSerializer,
)

EARTH_RADIUS_MILES = 3958.8


def haversine_miles(lat1, lng1, lat2, lng2):
    lat1, lng1, lat2, lng2 = map(radians, [lat1, lng1, lat2, lng2])
    d_lat = lat2 - lat1
    d_lng = lng2 - lng1
    a = sin(d_lat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(d_lng / 2) ** 2
    return 2 * EARTH_RADIUS_MILES * asin(sqrt(a))


class RestaurantViewSet(viewsets.ModelViewSet):
    serializer_class = RestaurantSerializer
    permission_classes = [permissions.IsAuthenticated, IsRestaurantOwner]

    def get_queryset(self):
        return Restaurant.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class TableViewSet(viewsets.ModelViewSet):
    serializer_class = TableSerializer
    permission_classes = [permissions.IsAuthenticated, IsRestaurantOwner]
    filterset_fields = ['restaurant']

    def get_queryset(self):
        return Table.objects.filter(restaurant__owner=self.request.user)


class AvailabilitySlotViewSet(viewsets.ModelViewSet):
    serializer_class = AvailabilitySlotSerializer
    permission_classes = [permissions.IsAuthenticated, IsRestaurantOwner]
    filterset_fields = ['table', 'status']

    def get_queryset(self):
        return AvailabilitySlot.objects.filter(table__restaurant__owner=self.request.user)


class BrowseAvailabilitySlotsView(generics.ListAPIView):
    """Diner-facing: any open slot at any restaurant, soonest first."""

    serializer_class = BrowseAvailabilitySlotSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['table__restaurant']

    def get_queryset(self):
        return (
            AvailabilitySlot.objects.filter(status=AvailabilitySlot.Status.OPEN, start_time__gte=timezone.now())
            .select_related('table', 'table__restaurant')
            .order_by('start_time')
        )

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        distances = {}
        results = list(queryset)

        if lat is not None and lng is not None:
            try:
                lat, lng = float(lat), float(lng)
            except ValueError:
                lat = lng = None

        if lat is not None and lng is not None:
            for slot in results:
                restaurant = slot.table.restaurant
                if restaurant.latitude is not None and restaurant.longitude is not None:
                    distances[slot.id] = round(
                        haversine_miles(lat, lng, float(restaurant.latitude), float(restaurant.longitude)), 1
                    )
            results.sort(key=lambda s: (distances.get(s.id) is None, distances.get(s.id, 0)))

        page = self.paginate_queryset(results)
        serializer = self.get_serializer(page if page is not None else results, many=True, context={
            **self.get_serializer_context(), 'distances': distances,
        })
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)
