from django.urls import path
from .views import AvailabilityListCreateView, AvailabilityDeleteView, TeamAvailabilityView

urlpatterns = [
    path('', AvailabilityListCreateView.as_view(), name='availability_list_create'),
    path('<int:pk>/', AvailabilityDeleteView.as_view(), name='availability_delete'),
    path('team/', TeamAvailabilityView.as_view(), name='team_availability'),
]
