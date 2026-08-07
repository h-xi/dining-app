from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenBlacklistView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/token/blacklist/', TokenBlacklistView.as_view(), name='token_blacklist'),
    path('api/', include('core.urls')),
]
