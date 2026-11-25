from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken


User = get_user_model()


class TokenLifecycleTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            email="token-security@example.com",
            password="StrongSecurePassword#2026",
        )

    def test_jwt_security_configuration(self):
        config = settings.SIMPLE_JWT

        self.assertEqual(
            config["ACCESS_TOKEN_LIFETIME"],
            timedelta(minutes=5),
        )
        self.assertEqual(
            config["REFRESH_TOKEN_LIFETIME"],
            timedelta(hours=24),
        )
        self.assertTrue(config["ROTATE_REFRESH_TOKENS"])
        self.assertTrue(config["BLACKLIST_AFTER_ROTATION"])

        self.assertIn(
            "rest_framework_simplejwt.token_blacklist",
            settings.INSTALLED_APPS,
        )

    def test_refresh_rotates_token(self):
        original = str(RefreshToken.for_user(self.user))

        response = self.client.post(
            reverse("refresh"),
            {"refresh": original},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertNotEqual(original, response.data["refresh"])

    def test_old_refresh_token_rejected_after_rotation(self):
        original = str(RefreshToken.for_user(self.user))

        first = self.client.post(
            reverse("refresh"),
            {"refresh": original},
            format="json",
        )

        self.assertEqual(first.status_code, 200)

        second = self.client.post(
            reverse("refresh"),
            {"refresh": original},
            format="json",
        )

        self.assertEqual(second.status_code, 401)

    def test_rotated_refresh_token_remains_valid(self):
        original = str(RefreshToken.for_user(self.user))

        first = self.client.post(
            reverse("refresh"),
            {"refresh": original},
            format="json",
        )

        self.assertEqual(first.status_code, 200)
        replacement = first.data["refresh"]

        second = self.client.post(
            reverse("refresh"),
            {"refresh": replacement},
            format="json",
        )

        self.assertEqual(second.status_code, 200)
        self.assertIn("access", second.data)
        self.assertIn("refresh", second.data)

    def test_logout_revokes_refresh_token(self):
        refresh_token = RefreshToken.for_user(self.user)
        token = str(refresh_token)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {refresh_token.access_token}"
        )

        logout = self.client.post(
            reverse("logout"),
            {"refresh": token},
            format="json",
        )

        self.assertEqual(logout.status_code, 200)

        refresh = self.client.post(
            reverse("refresh"),
            {"refresh": token},
            format="json",
        )

        self.assertEqual(refresh.status_code, 401)

    def test_logout_rejects_invalid_token(self):
        access = RefreshToken.for_user(self.user).access_token
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {access}"
        )

        response = self.client.post(
            reverse("logout"),
            {"refresh": "invalid-token"},
            format="json",
        )

        self.assertEqual(response.status_code, 401)

    def test_logout_requires_authentication(self):
        refresh = RefreshToken.for_user(self.user)

        response = self.client.post(
            reverse("logout"),
            {"refresh": str(refresh)},
            format="json",
        )

        self.assertEqual(response.status_code, 401)

    def test_logout_rejects_another_users_refresh_token(self):
        other_user = User.objects.create_user(
            email="different-user@example.com",
            password="DifferentSecurePassword#2026",
        )

        own_access = RefreshToken.for_user(self.user).access_token
        other_refresh = str(RefreshToken.for_user(other_user))

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {own_access}"
        )

        response = self.client.post(
            reverse("logout"),
            {"refresh": other_refresh},
            format="json",
        )

        self.assertEqual(response.status_code, 403)

        # Rejection must not revoke the other user's token.
        refresh_response = self.client.post(
            reverse("refresh"),
            {"refresh": other_refresh},
            format="json",
        )

        self.assertEqual(refresh_response.status_code, 200)
