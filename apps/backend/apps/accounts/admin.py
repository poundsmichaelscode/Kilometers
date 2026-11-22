from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import (
    UserCreationForm,
    UserChangeForm,
)

from .models import User


class KilometerUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = User
        fields = ("email",)


class KilometerUserChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = User
        fields = "__all__"


@admin.register(User)
class KilometerUserAdmin(UserAdmin):
    add_form = KilometerUserCreationForm
    form = KilometerUserChangeForm
    model = User

    list_display = (
        "email",
        "first_name",
        "last_name",
        "is_staff",
        "is_active",
        "date_joined",
    )

    list_filter = (
        "is_staff",
        "is_superuser",
        "is_active",
    )

    ordering = ("email",)

    search_fields = (
        "email",
        "first_name",
        "last_name",
    )

    readonly_fields = (
        "last_login",
        "date_joined",
    )

    fieldsets = (
        (None, {
            "fields": ("email", "password"),
        }),
        ("Personal information", {
            "fields": ("first_name", "last_name"),
        }),
        ("Permissions", {
            "fields": (
                "is_active",
                "is_staff",
                "is_superuser",
                "groups",
                "user_permissions",
            ),
        }),
        ("Important dates", {
            "fields": ("last_login", "date_joined"),
        }),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": (
                "email",
                "password1",
                "password2",
                "is_staff",
                "is_active",
            ),
        }),
    )
