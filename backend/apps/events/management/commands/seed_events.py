import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.events.models import Event, EventCategory, EventHighlight, EventSeries

User = get_user_model()


class Command(BaseCommand):
    help = "Seed database with realistic events (past, current, future, recurring, highlights)."

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting event seed process...")

        # 1. Ensure users exist
        users = []
        for i in range(1, 11):
            email = f"test{i}@example.com"
            username = f"testuser{i}"
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "username": username,
                    "first_name": "Test",
                    "last_name": f"User {i}",
                },
            )
            if created:
                user.set_password("password123")
                user.save()
            users.append(user)

        self.stdout.write(f"Verified {len(users)} test users.")

        # 2. Get/Create Categories
        categories_data = [
            ("Music", "music"),
            ("Tech", "laptop"),
            ("Sports", "trophy"),
            ("Arts", "palette"),
            ("Networking", "users"),
        ]
        categories = []
        for name, icon in categories_data:
            cat, _ = EventCategory.objects.get_or_create(
                name=name, defaults={"slug": name.lower(), "icon": icon}
            )
            categories.append(cat)

        now = timezone.now()

        # Helper to randomly select host/category
        def get_host():
            return random.choice(users)

        def get_cat():
            return random.choice(categories)

        # ---------------------------------------------------------
        # 3. Create COMPLETED Past Events (With Highlights)
        # ---------------------------------------------------------
        past_titles = [
            "Tech Startup Mixer 2025",
            "Summer Rooftop Party",
            "Local Art Gallery Opening",
            "Charity Run 5K",
        ]

        for i, title in enumerate(past_titles):
            start = now - timedelta(days=random.randint(5, 30))
            event = Event.objects.create(
                host=get_host(),
                title=title,
                description="A wonderful past event.",
                category=get_cat(),
                location_name="Downtown Venue",
                start_time=start,
                end_time=start + timedelta(hours=3),
                status="completed",
                lifecycle_state="completed",
                interest_count=random.randint(50, 250),
                ticket_count=random.randint(20, 100),
                capacity=150,
            )

            # Add highlights
            hl_count = random.randint(1, 3)
            for _ in range(hl_count):
                EventHighlight.objects.create(
                    event=event,
                    author=random.choice(users),
                    role="goer",
                    text="This event was amazing! So much fun.",
                    moderation_status="approved",
                )
            self.stdout.write(
                f"Created Past Event: {title} with {hl_count} highlights."
            )

        # ---------------------------------------------------------
        # 4. Create UPCOMING Published/Event Ready Events
        # ---------------------------------------------------------
        upcoming_titles = [
            "Future Forward Tech Conference",
            "Live Jazz Night",
            "Yoga in the Park",
            "Blockchain Developer Meetup",
        ]

        for title in upcoming_titles:
            start = now + timedelta(days=random.randint(2, 14))
            state = random.choice(["published", "event_ready"])
            event = Event.objects.create(
                host=get_host(),
                title=title,
                description="Don't miss out on this upcoming event.",
                category=get_cat(),
                location_name="Central City Park",
                start_time=start,
                end_time=start + timedelta(hours=4),
                status=state,
                lifecycle_state=state,
                interest_count=random.randint(100, 500),
                ticket_count=random.randint(10, 80),
                capacity=200,
            )
            self.stdout.write(f"Created Upcoming Event ({state}): {title}")

        # ---------------------------------------------------------
        # 5. Create LIVE Current Event
        # ---------------------------------------------------------
        live_event = Event.objects.create(
            host=get_host(),
            title="Ongoing Community Hackathon",
            description="We are currently hacking away!",
            category=categories[1],
            location_name="The Tech Hub",
            start_time=now - timedelta(hours=1),
            end_time=now + timedelta(hours=4),
            status="published",
            lifecycle_state="live",
            interest_count=350,
            ticket_count=120,
            capacity=150,
        )
        self.stdout.write(f"Created LIVE Event: {live_event.title}")

        # ---------------------------------------------------------
        # 6. Create RECURRING Event Series
        # ---------------------------------------------------------
        # A weekly farmers market
        series_host = get_host()
        farmers_market = EventSeries.objects.create(
            host=series_host,
            name="Weekly City Farmers Market",
            description="Fresh local produce every Saturday.",
            recurrence_rule="FREQ=WEEKLY;BYDAY=SA",
            default_location_name="City Square",
            default_capacity=500,
        )

        # 1 past incidence
        past_saturday = now - timedelta(days=7)
        past_sat_event = Event.objects.create(
            host=series_host,
            series=farmers_market,
            occurrence_index=1,
            title="Weekly City Farmers Market #1",
            description=farmers_market.description,
            category=categories[0],
            location_name=farmers_market.default_location_name,
            start_time=past_saturday,
            end_time=past_saturday + timedelta(hours=6),
            status="completed",
            lifecycle_state="completed",
            interest_count=80,
            ticket_count=40,
        )
        EventHighlight.objects.create(
            event=past_sat_event,
            author=random.choice(users),
            role="goer",
            text="Great fresh tomatoes this week!",
            moderation_status="approved",
        )

        # 1 upcoming incidence
        next_saturday = now + timedelta(days=7)
        Event.objects.create(
            host=series_host,
            series=farmers_market,
            occurrence_index=2,
            title="Weekly City Farmers Market #2",
            description=farmers_market.description,
            category=categories[0],
            location_name=farmers_market.default_location_name,
            start_time=next_saturday,
            end_time=next_saturday + timedelta(hours=6),
            status="published",
            lifecycle_state="published",
            interest_count=45,
            ticket_count=10,
        )
        self.stdout.write(
            "Created Recurring Series: Weekly City Farmers Market (1 past, 1 upcoming)"
        )

        self.stdout.write(
            self.style.SUCCESS("Successfully seeded 10 diverse events with highlights!")
        )
