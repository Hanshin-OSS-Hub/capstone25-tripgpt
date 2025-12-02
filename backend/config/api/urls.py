# backend/api/urls.py

from django.urls import path
from .views import TravelAPIView   # 방금 만든 뷰 import

urlpatterns = [
    # 최종 URL: /api/tmap/route/
    path("tmap/route/", TravelAPIView.as_view(), name="tmap-route"),
]
