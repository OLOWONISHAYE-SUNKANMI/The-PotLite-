from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    MeView,
    SendSMSView,
    VerifySMSView,
    SetupTwoFactorView,
    VerifyTwoFactorView,
)

urlpatterns = [
    path('register', RegisterView.as_view(), name='auth-register'),
    path('register/', RegisterView.as_view(), name='auth-register-slash'),
    path('login', LoginView.as_view(), name='auth-login'),
    path('login/', LoginView.as_view(), name='auth-login-slash'),
    path('logout', LogoutView.as_view(), name='auth-logout'),
    path('logout/', LogoutView.as_view(), name='auth-logout-slash'),
    path('me', MeView.as_view(), name='auth-me'),
    path('me/', MeView.as_view(), name='auth-me-slash'),
    path('sms/send', SendSMSView.as_view(), name='auth-sms-send'),
    path('sms/send/', SendSMSView.as_view(), name='auth-sms-send-slash'),
    path('sms/verify', VerifySMSView.as_view(), name='auth-sms-verify'),
    path('sms/verify/', VerifySMSView.as_view(), name='auth-sms-verify-slash'),
    path('2fa/setup', SetupTwoFactorView.as_view(), name='auth-2fa-setup'),
    path('2fa/setup/', SetupTwoFactorView.as_view(), name='auth-2fa-setup-slash'),
    path('2fa/verify', VerifyTwoFactorView.as_view(), name='auth-2fa-verify'),
    path('2fa/verify/', VerifyTwoFactorView.as_view(), name='auth-2fa-verify-slash'),
]
