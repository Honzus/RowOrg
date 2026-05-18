from django.contrib import admin
from django.urls import path, include

from availability.views import TeamAvailabilityBlocksView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/teams/', include('teams.urls')),
    path('api/availability/', include('availability.urls')),
    path('api/sessions/', include('training_sessions.urls')),
    path('api/suggestions/', include('suggestions.urls')),
    path('api/preferences/', include('preferences.urls')),
    path('api/templates/', include('preferences.templates_urls')),
    path('api/regattas/', include('regattas.urls')),
    path('api/planning/team-availability/', TeamAvailabilityBlocksView.as_view(), name='team-availability-blocks'),
]
