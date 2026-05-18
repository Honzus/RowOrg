from django.urls import path
from .views import RegattaListCreateView, RegattaDetailView

urlpatterns = [
    path('', RegattaListCreateView.as_view(), name='regatta_list_create'),
    path('<int:pk>/', RegattaDetailView.as_view(), name='regatta_detail'),
]
