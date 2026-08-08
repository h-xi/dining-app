from rest_framework import serializers

from .models import AvailabilitySlot, Restaurant, Table


class RestaurantSerializer(serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Restaurant
        fields = [
            'id', 'owner', 'name', 'description', 'cuisine_type',
            'address_line1', 'address_line2', 'city', 'state', 'postal_code',
            'timezone', 'phone_number', 'email', 'is_active',
            'latitude', 'longitude',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']


class TableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Table
        fields = [
            'id', 'restaurant', 'table_number', 'capacity',
            'location_description', 'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_restaurant(self, restaurant):
        request = self.context['request']
        if restaurant.owner_id != request.user.id:
            raise serializers.ValidationError("You don't own this restaurant.")
        return restaurant


class AvailabilitySlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = AvailabilitySlot
        fields = [
            'id', 'table', 'start_time', 'end_time', 'credit_value',
            'prepay_price', 'status', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'status', 'created_at', 'updated_at']

    def validate_table(self, table):
        request = self.context['request']
        if table.restaurant.owner_id != request.user.id:
            raise serializers.ValidationError("You don't own this table.")
        return table

    def validate(self, attrs):
        start_time = attrs.get('start_time', getattr(self.instance, 'start_time', None))
        end_time = attrs.get('end_time', getattr(self.instance, 'end_time', None))
        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError({'end_time': 'Must be after start_time.'})

        prepay_price = attrs.get('prepay_price', getattr(self.instance, 'prepay_price', None))
        credit_value = attrs.get('credit_value', getattr(self.instance, 'credit_value', None))
        if prepay_price is not None and credit_value is not None and prepay_price >= credit_value:
            raise serializers.ValidationError({'prepay_price': 'Must be less than credit_value.'})

        return attrs


class BrowseAvailabilitySlotSerializer(serializers.ModelSerializer):
    """Read-only, diner-facing view of an open slot with restaurant/table context."""

    restaurant_id = serializers.IntegerField(source='table.restaurant.id', read_only=True)
    restaurant_name = serializers.CharField(source='table.restaurant.name', read_only=True)
    cuisine_type = serializers.CharField(source='table.restaurant.cuisine_type', read_only=True)
    city = serializers.CharField(source='table.restaurant.city', read_only=True)
    state = serializers.CharField(source='table.restaurant.state', read_only=True)
    latitude = serializers.DecimalField(source='table.restaurant.latitude', max_digits=9, decimal_places=6, read_only=True)
    longitude = serializers.DecimalField(source='table.restaurant.longitude', max_digits=9, decimal_places=6, read_only=True)
    table_number = serializers.CharField(source='table.table_number', read_only=True)
    capacity = serializers.IntegerField(source='table.capacity', read_only=True)
    distance_miles = serializers.SerializerMethodField()

    class Meta:
        model = AvailabilitySlot
        fields = [
            'id', 'start_time', 'end_time', 'credit_value', 'prepay_price', 'status',
            'restaurant_id', 'restaurant_name', 'cuisine_type', 'city', 'state',
            'latitude', 'longitude', 'table_number', 'capacity', 'distance_miles',
        ]
        read_only_fields = fields

    def get_distance_miles(self, obj):
        return self.context.get('distances', {}).get(obj.id)
