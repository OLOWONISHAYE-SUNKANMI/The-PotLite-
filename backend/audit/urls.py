from django.urls import path
from .views import AuditTrailView

urlpatterns = [
    path('audit-trail', AuditTrailView.as_view(), name='audit-trail'),
    path('audit-trail/', AuditTrailView.as_view(), name='audit-trail-slash'),
]
