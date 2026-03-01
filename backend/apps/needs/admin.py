"""Admin registration for needs models."""

from django.contrib import admin

from .models import EventNeed, NeedApplication


@admin.register(EventNeed)
class EventNeedAdmin(admin.ModelAdmin):
    """Admin for EventNeed."""

    list_display = ["title", "event", "criticality", "status", "application_count"]
    list_filter = ["status", "criticality"]
    search_fields = ["title", "event__title"]


@admin.register(NeedApplication)
class NeedApplicationAdmin(admin.ModelAdmin):
    """Admin for NeedApplication."""

    list_display = ["vendor", "need", "status", "proposed_price", "created_at"]
    list_filter = ["status"]
    search_fields = ["vendor__username", "need__title"]
