from django.urls import path

from .views import CompareView

urlpatterns = [
    path("journeys/compare", CompareView.as_view(), name="journeys-compare"),
]
