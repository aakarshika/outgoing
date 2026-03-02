"""Base settings for the monolith project."""

import os
from pathlib import Path
from datetime import timedelta

try:
    import dj_database_url
except ImportError:
    dj_database_url = None

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "django-insecure-change-me-in-prod")
DEBUG = os.environ.get("DJANGO_DEBUG", "False").lower() == "true"

# Allow hosts to be defined via environment variables
env_hosts = os.environ.get("DJANGO_ALLOWED_HOSTS", "")
if env_hosts:
    ALLOWED_HOSTS = [h.strip() for h in env_hosts.split(",") if h.strip()]
else:
    # Default to allow all vercel domains and local if no env vars are explicitly set
    ALLOWED_HOSTS = ["*"] if DEBUG else [".vercel.app", "outgoing-backend.vercel.app"]

# CORS Settings
CORS_ALLOW_ALL_ORIGINS = (
    os.environ.get("CORS_ALLOW_ALL_ORIGINS", "False").lower() == "true"
)
env_cors_origins = os.environ.get("CORS_ALLOWED_ORIGINS", "")
if env_cors_origins:
    CORS_ALLOWED_ORIGINS = [h.strip() for h in env_cors_origins.split(",") if h.strip()]
elif not CORS_ALLOW_ALL_ORIGINS:
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:5173",
        "http://localhost:5151",
    ]

# In production, default to allowing all origins so the frontend can hit it
# You can override this by setting CORS_ALLOW_ALL_ORIGINS=False and defining CORS_ALLOWED_ORIGINS
if not DEBUG and not env_cors_origins and not CORS_ALLOW_ALL_ORIGINS:
    CORS_ALLOW_ALL_ORIGINS = True

# AI / LLM provider configuration
# The API key is intentionally read from the environment so that it can be
# configured per‑environment without changing code.
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

# Default model chosen to work with the free ChatGPT tier; you can override
# this per environment via the OPENAI_MODEL environment variable if needed.
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

# Security

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third party
    "rest_framework",
    "corsheaders",
    "rest_framework_simplejwt",
    "drf_spectacular",
    # Local
    "core",
    "api",
    "apps.profiles",
    "apps.events",
    "apps.tickets",
    "apps.vendors",
    "apps.needs",
    "apps.requests",
    "apps.content_generator",
    "silk",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "silk.middleware.SilkyMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

if dj_database_url:
    DATABASES = {
        "default": dj_database_url.config(
            default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
            conn_max_age=0,  # Must be 0 for Supabase transaction mode pooler (port 6543)
            conn_health_checks=False,
        )
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Media files (user uploads: avatars, cover photos, event images, portfolios)
MEDIA_ROOT = BASE_DIR / "media"
MEDIA_URL = "/media/"

REST_FRAMEWORK = {
    "DEFAULT_PAGINATION_CLASS": "core.pagination.StandardPagination",
    "PAGE_SIZE": 10,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "EXCEPTION_HANDLER": "core.exceptions.custom_exception_handler",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Outgoing API",
    "DESCRIPTION": "API Documentation for the Outgoing platform",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
    "ROTATE_REFRESH_TOKENS": True,
}
