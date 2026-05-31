# web/urls.py
from django.urls import path
from .views import TravelAPIView, SignupAPIView, LoginAPIView, LogoutAPIView, MeAPIView

urlpatterns = [
    path("tmap/route/", TravelAPIView.as_view(), name="tmap-route"),
    path("auth/signup/", SignupAPIView.as_view(), name="auth-signup"),
    path("auth/login/", LoginAPIView.as_view(), name="auth-login"),
    path("auth/logout/", LogoutAPIView.as_view(), name="auth-logout"),
    path("auth/me/", MeAPIView.as_view(), name="auth-me"),
]