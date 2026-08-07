from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    email = models.EmailField(unique=True)
    google_sub = models.CharField(
        max_length=255, unique=True, null=True, blank=True,
        help_text="Google's stable user ID ('sub' claim), set on first Google sign-in.",
    )
    avatar_url = models.URLField(blank=True)

    def __str__(self):
        return self.email
