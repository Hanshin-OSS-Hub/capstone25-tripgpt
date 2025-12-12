# backend/config/urls.py

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),

    # /api/ 로 들어오는 건 전부 api 앱으로 넘김
    path("api/", include("api.urls")),
]
