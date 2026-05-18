from rest_framework import generics
from rest_framework.exceptions import PermissionDenied

from .models import Regatta
from .serializers import RegattaSerializer


class RegattaListCreateView(generics.ListCreateAPIView):
    serializer_class = RegattaSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.team:
            return Regatta.objects.none()
        return Regatta.objects.filter(team=user.team)

    def perform_create(self, serializer):
        user = self.request.user
        if not user.team:
            raise PermissionDenied('You must belong to a team to add a regatta.')
        if user.role != 'coach':
            raise PermissionDenied('Only coaches can add regattas.')
        serializer.save(team=user.team, created_by=user)


class RegattaDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RegattaSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.team:
            return Regatta.objects.none()
        return Regatta.objects.filter(team=user.team)

    def _require_coach(self):
        if self.request.user.role != 'coach':
            raise PermissionDenied('Only coaches can modify regattas.')

    def perform_update(self, serializer):
        self._require_coach()
        serializer.save()

    def perform_destroy(self, instance):
        self._require_coach()
        instance.delete()
