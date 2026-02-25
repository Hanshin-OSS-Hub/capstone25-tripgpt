from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class AdminProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="admin_profile",
    )
    role_name = models.CharField(max_length=50, default="SYSTEM_ADMIN")
    can_manage_users = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.user_id and not self.user.is_staff:
            raise ValidationError("AdminProfile user must have is_staff=True.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"AdminProfile<{self.user.username}>"


class CustomerProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="customer_profile",
    )
    nickname = models.CharField(max_length=50, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    preferred_region = models.CharField(max_length=50, blank=True)
    travel_style = models.CharField(max_length=50, blank=True)
    marketing_opt_in = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"CustomerProfile<{self.user.username}>"
