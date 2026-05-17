from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Session, CrewAssignment, CrewSeat
from .serializers import SessionSerializer, CrewAssignmentSerializer, CrewAssignmentCreateSerializer


class SessionListCreateView(generics.ListCreateAPIView):
    serializer_class = SessionSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.team:
            return Session.objects.none()
        qs = Session.objects.filter(team=user.team)
        week_start = self.request.query_params.get('week_start')
        if week_start:
            from datetime import datetime, timedelta
            start = datetime.strptime(week_start, '%Y-%m-%d').date()
            end = start + timedelta(days=7)
            qs = qs.filter(date__gte=start, date__lt=end)
        return qs

    def perform_create(self, serializer):
        serializer.save(team=self.request.user.team, created_by=self.request.user)


class SessionDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = SessionSerializer

    def get_queryset(self):
        if not self.request.user.team:
            return Session.objects.none()
        return Session.objects.filter(team=self.request.user.team)


class CrewCreateView(generics.CreateAPIView):
    serializer_class = CrewAssignmentCreateSerializer

    def perform_create(self, serializer):
        session_id = self.kwargs['session_id']
        session = Session.objects.get(id=session_id, team=self.request.user.team)
        serializer.save(session=session)


class CrewConfirmView(generics.UpdateAPIView):
    serializer_class = CrewAssignmentSerializer

    def get_queryset(self):
        return CrewAssignment.objects.filter(session__team=self.request.user.team)

    def patch(self, request, *args, **kwargs):
        crew = self.get_object()
        crew.is_confirmed = True
        crew.is_cancelled = False
        crew.save()
        return Response(CrewAssignmentSerializer(crew).data)


class CrewCancelView(generics.UpdateAPIView):
    serializer_class = CrewAssignmentSerializer

    def get_queryset(self):
        return CrewAssignment.objects.filter(session__team=self.request.user.team)

    def patch(self, request, *args, **kwargs):
        crew = self.get_object()
        crew.is_cancelled = True
        crew.is_confirmed = False
        crew.save()
        return Response(CrewAssignmentSerializer(crew).data)
