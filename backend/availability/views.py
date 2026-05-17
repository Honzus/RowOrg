from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Availability
from .serializers import AvailabilitySerializer


class AvailabilityListCreateView(generics.ListCreateAPIView):
    serializer_class = AvailabilitySerializer

    def get_queryset(self):
        qs = Availability.objects.filter(user=self.request.user)
        week_start = self.request.query_params.get('week_start')
        if week_start:
            qs = qs.filter(week_start=week_start)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AvailabilityDeleteView(generics.DestroyAPIView):
    serializer_class = AvailabilitySerializer

    def get_queryset(self):
        return Availability.objects.filter(user=self.request.user)


class TeamAvailabilityView(APIView):
    """Coach view: see all team members' availability for a given date."""

    def get(self, request):
        user = request.user
        if not user.team:
            return Response({'error': 'Not in a team'}, status=400)
        date = request.query_params.get('date')
        week_start = request.query_params.get('week_start')
        qs = Availability.objects.filter(user__team=user.team)
        if week_start:
            qs = qs.filter(week_start=week_start)
        if date:
            from datetime import datetime
            d = datetime.strptime(date, '%Y-%m-%d').date()
            day_of_week = d.weekday()
            qs = qs.filter(day_of_week=day_of_week)
        serializer = AvailabilitySerializer(qs, many=True)
        return Response(serializer.data)
