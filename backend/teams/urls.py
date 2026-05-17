from django.urls import path
from .views import TeamCreateView, TeamDetailView, JoinTeamView

urlpatterns = [
    path('', TeamCreateView.as_view(), name='team_create'),
    path('<uuid:pk>/', TeamDetailView.as_view(), name='team_detail'),
    path('join/', JoinTeamView.as_view(), name='team_join'),
]
