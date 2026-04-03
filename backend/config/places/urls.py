from django.urls import path

from places.views import TourismPlaceListAPIView


urlpatterns = [
    path("", TourismPlaceListAPIView.as_view(), name="place-list"),
]
