from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    # ThePotLite V1 REST API endpoints
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/pots/', include('pots.urls')),
    path('api/v1/governance/', include('governance.urls')),
    path('api/v1/', include('pots.urls')),
    path('api/v1/', include('governance.urls')),
    path('api/v1/', include('audit.urls')),
]
