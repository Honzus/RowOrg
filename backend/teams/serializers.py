from rest_framework import serializers
from .models import Team
from users.serializers import UserSerializer


class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ['id', 'name', 'invite_code', 'created_at']
        read_only_fields = ['id', 'invite_code', 'created_at']


class TeamDetailSerializer(serializers.ModelSerializer):
    members = UserSerializer(many=True, read_only=True)

    class Meta:
        model = Team
        fields = ['id', 'name', 'invite_code', 'created_at', 'members']


class JoinTeamSerializer(serializers.Serializer):
    invite_code = serializers.CharField(max_length=8)
