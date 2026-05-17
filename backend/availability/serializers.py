from rest_framework import serializers
from .models import Availability


class AvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Availability
        fields = ['id', 'user', 'week_start', 'day_of_week', 'start_time', 'end_time']
        read_only_fields = ['id', 'user']
