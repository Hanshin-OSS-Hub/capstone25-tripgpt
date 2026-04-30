from django.urls import path

from places.views import RecommendationAPIView, TourismPlaceListAPIView


urlpatterns = [
    path("", TourismPlaceListAPIView.as_view(), name="place-list"),
    path("search/", TourismPlaceListAPIView.as_view(), name="place-search"),
    path("recommendations/", RecommendationAPIView.as_view(), name="recommendations"),
]
