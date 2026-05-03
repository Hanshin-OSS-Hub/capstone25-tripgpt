from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

from .models import AdminProfile, CustomerProfile


class ProfileModelTests(TestCase):
    def test_customer_profile_can_be_created(self):
        user = get_user_model().objects.create_user(
            username="customer1",
            email="customer1@example.com",
            password="pass1234!",
        )

        profile = CustomerProfile.objects.create(
            user=user,
            nickname="triplover",
            preferred_region="강원",
            travel_style="힐링",
            marketing_opt_in=True,
        )

        self.assertEqual(profile.user.username, "customer1")
        self.assertTrue(profile.marketing_opt_in)

    def test_admin_profile_requires_staff_user(self):
        user = get_user_model().objects.create_user(
            username="normal_user",
            email="normal@example.com",
            password="pass1234!",
        )

        with self.assertRaises(ValidationError):
            AdminProfile.objects.create(user=user)

    def test_admin_profile_with_superuser(self):
        admin_user = get_user_model().objects.create_superuser(
            username="admin1",
            email="admin1@example.com",
            password="adminpass123!",
        )

        profile = AdminProfile.objects.create(user=admin_user, role_name="MASTER_ADMIN")
        self.assertEqual(profile.user.username, "admin1")
