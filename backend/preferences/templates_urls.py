from django.urls import path
from .views import LineupTemplateListCreateView, LineupTemplateDetailView

urlpatterns = [
    path('', LineupTemplateListCreateView.as_view(), name='lineup_template_list_create'),
    path('<int:pk>/', LineupTemplateDetailView.as_view(), name='lineup_template_detail'),
]
