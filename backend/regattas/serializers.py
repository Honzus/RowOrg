from rest_framework import serializers
from .models import Regatta


class RegattaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Regatta
        fields = [
            'id', 'team', 'name', 'date', 'location',
            'registered', 'crews_entered', 'note',
            'created_by', 'created_at',
        ]
        read_only_fields = ['team', 'created_by', 'created_at']
