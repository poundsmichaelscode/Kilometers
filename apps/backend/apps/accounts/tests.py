from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

User = get_user_model()


class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.email = "testuser@example.com"
        self.password = "SecureTestPassword@2026"

    def create_user(self):
        return User.objects.create_user(
            email=self.email,
            password=self.password,
        )

    def test_user_registration(self):
        response = self.client.post(
            "/api/v1/auth/register",
            {
                "email": self.email,
                "password": self.password,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            User.objects.filter(email=self.email).exists()
        )
        self.assertNotIn("password", response.data)

    def test_duplicate_email_rejected(self):
        self.create_user()

        response = self.client.post(
            "/api/v1/auth/register",
            {
                "email": self.email,
                "password": self.password,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_login_returns_jwt_tokens(self):
        self.create_user()

        response = self.client.post(
            "/api/v1/auth/login",
            {
                "email": self.email,
                "password": self.password,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_profile_requires_authentication(self):
        response = self.client.get("/api/v1/me")

        self.assertEqual(response.status_code, 401)

    def test_authenticated_user_profile(self):
        self.create_user()

        login = self.client.post(
            "/api/v1/auth/login",
            {
                "email": self.email,
                "password": self.password,
            },
            format="json",
        )

        token = login.data["access"]

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )

        response = self.client.get("/api/v1/me")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["email"], self.email)

    def test_refresh_token(self):
        self.create_user()

        login = self.client.post(
            "/api/v1/auth/login",
            {
                "email": self.email,
                "password": self.password,
            },
            format="json",
        )

        response = self.client.post(
            "/api/v1/auth/refresh",
            {"refresh": login.data["refresh"]},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)

    def test_health_endpoint(self):
        response = self.client.get("/api/v1/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "ok")
