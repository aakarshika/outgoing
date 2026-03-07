import os
import sys

# Ensure the root directory of your app is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# MUST set settings module BEFORE importing Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")

from django.core.wsgi import get_wsgi_application  # noqa: E402

# The `@vercel/python` builder expects a variable named `app`
app = get_wsgi_application()
