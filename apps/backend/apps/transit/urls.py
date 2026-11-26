from django.urls import path

from .views import FareListView, RouteDetailView, RouteListView, StopListView

urlpatterns = [
    path("transit/stops", StopListView.as_view(), name="transit-stops"),
    path("transit/routes", RouteListView.as_view(), name="transit-routes"),
    path("transit/routes/<int:pk>", RouteDetailView.as_view(), name="transit-route-detail"),
    path("transit/fares", FareListView.as_view(), name="transit-fares"),
]
