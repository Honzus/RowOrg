from django.urls import path
from .views import SessionListCreateView, SessionDetailView, CrewCreateView, CrewConfirmView, CrewCancelView

urlpatterns = [
    path('', SessionListCreateView.as_view(), name='session_list_create'),
    path('<int:pk>/', SessionDetailView.as_view(), name='session_detail'),
    path('<int:session_id>/crews/', CrewCreateView.as_view(), name='crew_create'),
    path('<int:session_id>/crews/<int:pk>/confirm/', CrewConfirmView.as_view(), name='crew_confirm'),
    path('<int:session_id>/crews/<int:pk>/cancel/', CrewCancelView.as_view(), name='crew_cancel'),
]
