from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenBlacklistView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/token/blacklist/', TokenBlacklistView.as_view(), name='token_blacklist'),
    path('api/', include('accounts.urls')),
    path('api/', include('core.urls')),
]
