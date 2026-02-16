"""Development settings for the monolith project."""

# pylint: disable=wildcard-import, unused-wildcard-import
from .base import *  # noqa: F403, F401

DEBUG = True
ALLOWED_HOSTS = ["*"]

# CORS Settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5995",
    "http://localhost:5173",
    "http://localhost:5151",
    "http://localhost:5995",
]
