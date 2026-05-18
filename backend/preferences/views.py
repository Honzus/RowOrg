from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from .models import CoachPreference, PreferredPairing, LineupTemplate
from .serializers import (
    CoachPreferenceSerializer,
    PreferredPairingSerializer,
    LineupTemplateSerializer,
)


class CoachPreferenceListCreateView(generics.ListCreateAPIView):
    serializer_class = CoachPreferenceSerializer

    def get_queryset(self):
        return CoachPreference.objects.filter(coach=self.request.user)

    def perform_create(self, serializer):
        serializer.save(coach=self.request.user)


class CoachPreferenceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CoachPreferenceSerializer

    def get_queryset(self):
        return CoachPreference.objects.filter(coach=self.request.user)


class PreferredPairingListCreateView(generics.ListCreateAPIView):
    serializer_class = PreferredPairingSerializer

    def get_queryset(self):
        return PreferredPairing.objects.filter(coach=self.request.user)

    def perform_create(self, serializer):
        serializer.save(coach=self.request.user)


class PreferredPairingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PreferredPairingSerializer

    def get_queryset(self):
        return PreferredPairing.objects.filter(coach=self.request.user)


class LineupTemplateListCreateView(generics.ListCreateAPIView):
    serializer_class = LineupTemplateSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.team:
            return LineupTemplate.objects.none()
        return LineupTemplate.objects.filter(team=user.team).prefetch_related('seats__rower')

    def perform_create(self, serializer):
        if self.request.user.role != 'coach':
            raise PermissionDenied('Only coaches can create lineup templates.')
        if not self.request.user.team:
            raise PermissionDenied('You must belong to a team to create a template.')
        serializer.save()


class LineupTemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = LineupTemplateSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.team:
            return LineupTemplate.objects.none()
        return LineupTemplate.objects.filter(team=user.team).prefetch_related('seats__rower')

    def _require_coach(self):
        if self.request.user.role != 'coach':
            raise PermissionDenied('Only coaches can modify lineup templates.')

    def perform_update(self, serializer):
        self._require_coach()
        serializer.save()

    def perform_destroy(self, instance):
        self._require_coach()
        instance.delete()
