from rest_framework import serializers
from users.serializers import UserMinimalSerializer
from .models import CoachPreference, PreferredPairing, LineupTemplate, LineupTemplateSeat


BOAT_SEATS = {'1x': 1, '2x': 2, '2-': 2, '4x': 4, '4-': 4, '4+': 4, '8+': 8}


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


class LineupTemplateSeatSerializer(serializers.ModelSerializer):
    rower_detail = UserMinimalSerializer(source='rower', read_only=True)

    class Meta:
        model = LineupTemplateSeat
        fields = ['position', 'rower', 'rower_detail']


class LineupTemplateSerializer(serializers.ModelSerializer):
    seats = LineupTemplateSeatSerializer(many=True, read_only=True)
    lineup = serializers.SerializerMethodField()
    cox_detail = UserMinimalSerializer(source='cox', read_only=True)

    class Meta:
        model = LineupTemplate
        fields = [
            'id', 'team', 'name', 'boat_type', 'note',
            'cox', 'cox_detail', 'lineup', 'seats',
            'created_by', 'created_at', 'updated_at',
        ]
        read_only_fields = ['team', 'created_by', 'created_at', 'updated_at']

    def get_lineup(self, obj):
        return [s.rower_id for s in obj.seats.all()]

    def validate(self, data):
        request = self.context.get('request')
        lineup = None
        if request is not None:
            raw_lineup = request.data.get('lineup')
            if isinstance(raw_lineup, list):
                lineup = raw_lineup

        boat_type = data.get('boat_type') or (self.instance.boat_type if self.instance else None)
        expected = BOAT_SEATS.get(boat_type)
        if lineup is not None:
            if expected is not None and len(lineup) != expected:
                raise serializers.ValidationError(
                    f'Boat type {boat_type} needs {expected} rower seats; got {len(lineup)}.'
                )
            data['_lineup'] = lineup
        elif self.instance is None:
            raise serializers.ValidationError({'lineup': 'A list of rower IDs (stroke → bow) is required.'})
        return data

    def create(self, validated_data):
        lineup = validated_data.pop('_lineup', None)
        request = self.context['request']
        template = LineupTemplate.objects.create(
            team=request.user.team,
            created_by=request.user,
            **validated_data,
        )
        if lineup:
            for i, rid in enumerate(lineup):
                LineupTemplateSeat.objects.create(template=template, position=i, rower_id=rid)
        return template

    def update(self, instance, validated_data):
        lineup = validated_data.pop('_lineup', None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()
        if lineup is not None:
            instance.seats.all().delete()
            for i, rid in enumerate(lineup):
                LineupTemplateSeat.objects.create(template=instance, position=i, rower_id=rid)
        return instance
