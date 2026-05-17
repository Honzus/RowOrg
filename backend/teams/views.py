from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Team
from .serializers import TeamSerializer, TeamDetailSerializer, JoinTeamSerializer


class TeamCreateView(generics.CreateAPIView):
    serializer_class = TeamSerializer

    def perform_create(self, serializer):
        team = serializer.save()
        self.request.user.team = team
        self.request.user.save()


class TeamDetailView(generics.RetrieveAPIView):
    serializer_class = TeamDetailSerializer
    queryset = Team.objects.all()


class JoinTeamView(APIView):
    def post(self, request):
        serializer = JoinTeamSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data['invite_code']
        try:
            team = Team.objects.get(invite_code=code.upper())
        except Team.DoesNotExist:
            return Response({'error': 'Invalid invite code'}, status=status.HTTP_404_NOT_FOUND)
        request.user.team = team
        request.user.save()
        return Response(TeamSerializer(team).data)
