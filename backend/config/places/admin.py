from django.contrib import admin
from .models import TourismPlace


@admin.register(TourismPlace)
class TourismPlaceAdmin(admin.ModelAdmin):
    list_display = ("content_id", "title", "content_type_id", "area_code", "sigungu_code", "updated_at")
    search_fields = ("title", "content_id", "addr1", "addr2")
    list_filter = ("content_type_id", "area_code", "sigungu_code", "is_active")
