# places/urls.py

from django.urls import path

from .views import RecommendationAPIView

urlpatterns = [
    path("recommendations/", RecommendationAPIView.as_view(), name="recommendations"),
]
