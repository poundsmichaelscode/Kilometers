from rest_framework.throttling import SimpleRateThrottle


class AuthenticationIPThrottle(SimpleRateThrottle):
    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }


class RegistrationThrottle(AuthenticationIPThrottle):
    scope = "registration"


class LoginThrottle(AuthenticationIPThrottle):
    scope = "login"


class TokenRefreshThrottle(AuthenticationIPThrottle):
    scope = "token_refresh"
