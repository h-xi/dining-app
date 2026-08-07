from django.conf import settings
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import GoogleLoginSerializer


class GoogleLoginView(APIView):
    """
    Verifies a Google ID token, creates/finds the matching local user
    (no password is ever set or stored), and returns our own JWT pair.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = GoogleLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            payload = google_id_token.verify_oauth2_token(
                serializer.validated_data['id_token'],
                google_requests.Request(),
                settings.GOOGLE_OAUTH_CLIENT_ID,
            )
        except ValueError:
            return Response(
                {'detail': 'Invalid Google ID token.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        google_sub = payload['sub']
        email = payload.get('email', '')

        user, created = User.objects.get_or_create(
            google_sub=google_sub,
            defaults={
                'username': email or google_sub,
                'email': email,
                'first_name': payload.get('given_name', ''),
                'last_name': payload.get('family_name', ''),
                'avatar_url': payload.get('picture', ''),
            },
        )
        if created:
            user.set_unusable_password()
            user.save(update_fields=['password'])

        refresh = RefreshToken.for_user(user)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'avatar_url': user.avatar_url,
            },
        })
