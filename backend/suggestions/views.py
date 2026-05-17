from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from training_sessions.models import Session
from .engine import generate_suggestions


class SuggestionsView(APIView):
    def get(self, request, session_id):
        try:
            session = Session.objects.get(id=session_id, team=request.user.team)
        except Session.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

        suggestions = generate_suggestions(session)
        return Response(suggestions)
