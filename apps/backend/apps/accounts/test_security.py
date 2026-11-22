from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.urls import reverse
from rest_framework.test import APITestCase


User = get_user_model()


class AuthenticationSecurityTests(APITestCase):

    def setUp(self):
        cache.clear()

    def tearDown(self):
        cache.clear()
        super().tearDown()

    def test_weak_password_rejected(self):
        response = self.client.post(
            reverse("register"),
            {
                "email": "security@example.com",
                "password": "12345678",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.data)

    def test_password_similar_to_email_rejected(self):
        response = self.client.post(
            reverse("register"),
            {
                "email": "kilometersecurity@example.com",
                "password": "kilometersecurity",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.data)

    def test_password_is_not_exposed(self):
        response = self.client.post(
            reverse("register"),
            {
                "email": "private@example.com",
                "password": "G7!vQ9#rT2@zX4",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertNotIn("password", response.data)

    def test_password_is_hashed(self):
        password = "G7!vQ9#rT2@zX4"

        user = User.objects.create_user(
            email="hashed@example.com",
            password=password,
        )

        self.assertNotEqual(user.password, password)
        self.assertTrue(user.check_password(password))

    def test_login_is_rate_limited(self):
        for _ in range(5):
            response = self.client.post(
                reverse("login"),
                {
                    "email": "unknown@example.com",
                    "password": "incorrect-password",
                },
                format="json",
            )
            self.assertEqual(response.status_code, 401)

        response = self.client.post(
            reverse("login"),
            {
                "email": "unknown@example.com",
                "password": "incorrect-password",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 429)

    def test_registration_is_rate_limited(self):
        for index in range(5):
            response = self.client.post(
                reverse("register"),
                {
                    "email": f"limited{index}@example.com",
                    "password": "12345678",
                },
                format="json",
            )

            self.assertEqual(response.status_code, 400)

        response = self.client.post(
            reverse("register"),
            {
                "email": "limited6@example.com",
                "password": "12345678",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 429)

    def test_invalid_refresh_token_rejected(self):
        response = self.client.post(
            reverse("refresh"),
            {"refresh": "invalid-token"},
            format="json",
        )

        self.assertEqual(response.status_code, 401)

    def test_user_email_is_normalized(self):
        user = User.objects.create_user(
            email="  NORMALIZED@EXAMPLE.COM  ",
            password="G7!vQ9#rT2@zX4",
        )

        self.assertEqual(
            user.email,
            "normalized@example.com",
        )
