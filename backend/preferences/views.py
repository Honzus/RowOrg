from rest_framework import generics
from .models import CoachPreference, PreferredPairing
from .serializers import CoachPreferenceSerializer, PreferredPairingSerializer


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
