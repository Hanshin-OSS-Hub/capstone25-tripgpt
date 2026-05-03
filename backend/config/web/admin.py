from django.contrib import admin
from .models import AdminProfile, CustomerProfile


@admin.register(AdminProfile)
class AdminProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role_name", "can_manage_users", "created_at")
    search_fields = ("user__username", "user__email", "role_name")


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "nickname", "preferred_region", "travel_style", "marketing_opt_in")
    search_fields = ("user__username", "user__email", "nickname", "phone")
