from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AvailabilitySlotViewSet,
    BrowseAvailabilitySlotsView,
    RestaurantViewSet,
    TableViewSet,
)

router = DefaultRouter()
router.register('restaurants', RestaurantViewSet, basename='restaurant')
router.register('tables', TableViewSet, basename='table')
router.register('availability-slots', AvailabilitySlotViewSet, basename='availabilityslot')

urlpatterns = router.urls + [
    path('browse/slots/', BrowseAvailabilitySlotsView.as_view(), name='browse-slots'),
]
