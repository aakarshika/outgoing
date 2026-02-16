from django.apps import AppConfig


class ContentGeneratorConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    # App is mounted under the "apps" package, so the full dotted path
    # must include the "apps." prefix for Django to import it correctly.
    name = "apps.content_generator"
