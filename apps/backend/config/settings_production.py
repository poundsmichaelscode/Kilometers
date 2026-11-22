import os

from django.core.exceptions import ImproperlyConfigured

from .settings import *


def required_env(name):
    value = os.environ.get(name, "").strip()

    if not value:
        raise ImproperlyConfigured(
            f"Missing required environment variable: {name}"
        )

    return value


def env_list(name):
    return [
        item.strip()
        for item in required_env(name).split(",")
        if item.strip()
    ]


DEBUG = False

SECRET_KEY = required_env("DJANGO_SECRET_KEY")

if len(SECRET_KEY) < 50:
    raise ImproperlyConfigured(
        "Production secret key must contain at least 50 characters."
    )

ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS")

if "*" in ALLOWED_HOSTS:
    raise ImproperlyConfigured(
        "Wildcard hosts are not allowed in production."
    )

CORS_ALLOWED_ORIGINS = env_list(
    "DJANGO_CORS_ALLOWED_ORIGINS"
)

CSRF_TRUSTED_ORIGINS = env_list(
    "DJANGO_CSRF_TRUSTED_ORIGINS"
)

CORS_ALLOW_ALL_ORIGINS = False

DATABASES["default"].update({
    "NAME": required_env("POSTGRES_DB"),
    "USER": required_env("POSTGRES_USER"),
    "PASSWORD": required_env("POSTGRES_PASSWORD"),
    "HOST": required_env("POSTGRES_HOST"),
    "PORT": os.getenv("POSTGRES_PORT", "5432"),
    "CONN_MAX_AGE": 60,
    "CONN_HEALTH_CHECKS": True,
})

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": required_env("REDIS_URL"),
        "TIMEOUT": 300,
        "KEY_PREFIX": "kilometer",
    }
}

SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_SECURE = True
SECURE_CONTENT_TYPE_NOSNIFF = True

SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False

SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"

X_FRAME_OPTIONS = "DENY"

# Enable only behind a trusted reverse proxy that
# sanitizes incoming X-Forwarded-Proto headers.
if os.getenv("DJANGO_TRUST_PROXY_SSL", "false").lower() == "true":
    SECURE_PROXY_SSL_HEADER = (
        "HTTP_X_FORWARDED_PROTO",
        "https",
    )

STATIC_ROOT = BASE_DIR / "staticfiles"

MIDDLEWARE.insert(
    MIDDLEWARE.index(
        "django.middleware.security.SecurityMiddleware"
    ) + 1,
    "whitenoise.middleware.WhiteNoiseMiddleware",
)

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": (
            "whitenoise.storage.CompressedManifestStaticFilesStorage"
        ),
    },
}

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
}
