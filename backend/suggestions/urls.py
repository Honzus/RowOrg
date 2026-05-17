from django.urls import path
from .views import SuggestionsView

urlpatterns = [
    path('<int:session_id>/', SuggestionsView.as_view(), name='suggestions'),
]
