# backend/config/urls.py

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),

    # /api/ 로 들어오는 건 전부 web 앱으로 넘김
    path("api/", include("web.urls")),
    path("places/", include("places.urls")),
]
