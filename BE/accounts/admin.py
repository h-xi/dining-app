from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from django.contrib import admin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'username', 'google_sub', 'is_staff')
    search_fields = ('email', 'username', 'google_sub')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Google sign-in', {'fields': ('google_sub', 'avatar_url')}),
    )
