from rest_framework import serializers
from .models import CoachPreference, PreferredPairing


class CoachPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoachPreference
        fields = ['id', 'coach', 'rower', 'preferred_boat_type', 'preferred_seat', 'priority']
        read_only_fields = ['id', 'coach']


class PreferredPairingSerializer(serializers.ModelSerializer):
    class Meta:
        model = PreferredPairing
        fields = ['id', 'coach', 'rowers', 'boat_type', 'note']
        read_only_fields = ['id', 'coach']
