from rest_framework import serializers
from .models import Session, CrewAssignment, CrewSeat
from users.serializers import UserSerializer


class CrewSeatSerializer(serializers.ModelSerializer):
    rower_detail = UserSerializer(source='rower', read_only=True)

    class Meta:
        model = CrewSeat
        fields = ['id', 'rower', 'rower_detail', 'seat_number', 'is_cox']


class CrewAssignmentSerializer(serializers.ModelSerializer):
    seats = CrewSeatSerializer(many=True, read_only=True)

    class Meta:
        model = CrewAssignment
        fields = ['id', 'session', 'boat_type', 'is_confirmed', 'is_cancelled', 'seats']
        read_only_fields = ['id']


class CrewAssignmentCreateSerializer(serializers.ModelSerializer):
    seats = CrewSeatSerializer(many=True)

    class Meta:
        model = CrewAssignment
        fields = ['boat_type', 'is_confirmed', 'seats']

    def create(self, validated_data):
        seats_data = validated_data.pop('seats')
        crew = CrewAssignment.objects.create(**validated_data)
        for seat_data in seats_data:
            CrewSeat.objects.create(crew=crew, **seat_data)
        return crew


class SessionSerializer(serializers.ModelSerializer):
    crews = CrewAssignmentSerializer(many=True, read_only=True)

    class Meta:
        model = Session
        fields = ['id', 'team', 'date', 'start_time', 'end_time', 'description', 'created_by', 'created_at', 'crews']
        read_only_fields = ['id', 'team', 'created_by', 'created_at']
