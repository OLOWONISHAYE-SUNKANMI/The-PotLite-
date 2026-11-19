from django.urls import path
from .views import AuditTrailView

urlpatterns = [
    path('audit-trail', AuditTrailView.as_view(), name='audit-trail'),
    path('audit-trail/', AuditTrailView.as_view(), name='audit-trail-slash'),
    path('audit', AuditTrailView.as_view(), name='audit-list'),
    path('audit/', AuditTrailView.as_view(), name='audit-list-slash'),
    path('audit/timeline', AuditTrailView.as_view(), name='audit-timeline'),
    path('audit/timeline/', AuditTrailView.as_view(), name='audit-timeline-slash'),
]

