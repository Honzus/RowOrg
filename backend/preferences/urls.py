from django.urls import path
from .views import (
    CoachPreferenceListCreateView, CoachPreferenceDetailView,
    PreferredPairingListCreateView, PreferredPairingDetailView,
)

urlpatterns = [
    path('', CoachPreferenceListCreateView.as_view(), name='preference_list_create'),
    path('<int:pk>/', CoachPreferenceDetailView.as_view(), name='preference_detail'),
    path('pairings/', PreferredPairingListCreateView.as_view(), name='pairing_list_create'),
    path('pairings/<int:pk>/', PreferredPairingDetailView.as_view(), name='pairing_detail'),
]
