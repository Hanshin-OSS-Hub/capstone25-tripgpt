# backend/web/urls.py

from django.urls import path
from .views import TravelAPIView   

urlpatterns = [
    # 최종 URL: /api/tmap/route/
    path("tmap/route/", TravelAPIView.as_view(), name="tmap-route"),
]
