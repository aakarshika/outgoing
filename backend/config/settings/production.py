# flake8: noqa: F405
from .base import *  # noqa: F401,F403

DEBUG = os.environ.get("DJANGO_DEBUG", "False").lower() == "true"

# ---------- Security ----------
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
# Vercel terminates SSL at the edge — enabling this causes infinite redirects
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Django 4+ requires this for all POST requests over HTTPS
CSRF_TRUSTED_ORIGINS = [
    "https://outgoing-backend.vercel.app",
    "https://*.vercel.app",
]

# ---------- Static files ----------
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedStaticFilesStorage"
# Serve files directly from app static dirs — no collectstatic needed
WHITENOISE_USE_FINDERS = True

# ---------- WhiteNoise for serving static files ----------
# Insert WhiteNoise right after SecurityMiddleware
_security_idx = next(
    (
        i
        for i, m in enumerate(MIDDLEWARE)
        if m == "django.middleware.security.SecurityMiddleware"
    ),
    0,
)
MIDDLEWARE.insert(_security_idx + 1, "whitenoise.middleware.WhiteNoiseMiddleware")

# ---------- Remove Silk in production ----------
# Silk has native C extensions that fail to compile on Vercel's Lambda runtime.
INSTALLED_APPS = [app for app in INSTALLED_APPS if app != "silk"]
MIDDLEWARE = [m for m in MIDDLEWARE if m != "silk.middleware.SilkyMiddleware"]
