from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from django.views.generic import RedirectView

urlpatterns = [
    path('admin/', admin.site.urls),

    # OpenAPI Schema & Interactive Documentation (Swagger / ReDoc)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    path('swagger/', RedirectView.as_view(url='/api/docs/', permanent=False)),
    path('docs/', RedirectView.as_view(url='/api/docs/', permanent=False)),

    # Root redirect to Swagger docs for clean developer experience
    path('', RedirectView.as_view(url='/api/docs/', permanent=False)),

    # ThePotLite V1 REST API endpoints
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/pots/', include('pots.urls')),
    path('api/v1/governance/', include('governance.urls')),
    path('api/v1/assistance/', include('assistance.urls')),
    path('api/v1/', include('pots.urls')),
    path('api/v1/', include('governance.urls')),
    path('api/v1/', include('assistance.urls')),
    path('api/v1/', include('audit.urls')),
]
