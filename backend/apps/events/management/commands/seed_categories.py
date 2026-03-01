"""Management command to seed event categories."""

from django.core.management.base import BaseCommand

from apps.events.models import EventCategory

CATEGORIES = [
    {"name": "Music", "slug": "music", "icon": "music"},
    {"name": "Food & Drink", "slug": "food-drink", "icon": "utensils"},
    {"name": "Nightlife", "slug": "nightlife", "icon": "moon"},
    {"name": "Sports & Fitness", "slug": "sports-fitness", "icon": "dumbbell"},
    {"name": "Arts & Culture", "slug": "arts-culture", "icon": "palette"},
    {"name": "Tech & Innovation", "slug": "tech-innovation", "icon": "cpu"},
    {"name": "Workshops & Classes", "slug": "workshops-classes", "icon": "book-open"},
    {"name": "Outdoors & Adventure", "slug": "outdoors-adventure", "icon": "mountain"},
    {"name": "Comedy", "slug": "comedy", "icon": "laugh"},
    {"name": "Networking & Social", "slug": "networking-social", "icon": "users"},
    {"name": "Festivals", "slug": "festivals", "icon": "party-popper"},
    {"name": "Community", "slug": "community", "icon": "heart-handshake"},
]


class Command(BaseCommand):
    """Seed the database with predefined event categories."""

    help = "Seeds the database with 12 default event categories"

    def handle(self, *args, **options):
        """Execute the command."""
        created_count = 0
        for cat_data in CATEGORIES:
            _, created = EventCategory.objects.get_or_create(
                slug=cat_data["slug"],
                defaults={"name": cat_data["name"], "icon": cat_data["icon"]},
            )
            if created:
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {created_count} new categories "
                f"({len(CATEGORIES) - created_count} already existed)"
            )
        )
