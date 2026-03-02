from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db import transaction

from apps.events.models import (
    EventCategory,
    EventSeries,
    EventSeriesNeedTemplate,
    Event,
    EventMedia,
    EventInterest,
    EventLifecycleTransition,
    EventHighlight,
    EventReview,
    EventReviewMedia,
    EventVendorReview,
    EventView,
)
from apps.profiles.models import UserProfile
from apps.vendors.models import VendorService, VendorReview
from apps.needs.models import EventNeed, NeedApplication, NeedInvite
from apps.tickets.models import Ticket
from apps.requests.models import EventRequest, RequestUpvote, RequestWishlist

User = get_user_model()

PLACEHOLDER_AVATAR = "https://placehold.co/150x150/png"
PLACEHOLDER_COVER = "https://placehold.co/800x400/png"
PLACEHOLDER_EVENT_IMG = "https://placehold.co/600x400/png"
PLACEHOLDER_PORTFOLIO = "https://placehold.co/800x600/png"

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
    help = "Wipes and re-seeds the database with comprehensive sample data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--no-wipe",
            action="store_true",
            help="Do not wipe existing data (may cause duplicates/errors).",
        )

    def wipe_data(self):
        self.stdout.write("Wiping existing data...")
        EventRequest.objects.all().delete()
        VendorService.objects.all().delete()
        EventSeries.objects.all().delete()
        Event.objects.all().delete()
        UserProfile.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        # Note: Categories are not wiped by default unless needed, but we can leave them
        self.stdout.write(self.style.SUCCESS("Data wiped successfully."))

    @transaction.atomic
    def handle(self, *args, **options):
        if not options["no_wipe"]:
            self.wipe_data()

        now = timezone.now()

        # 1. Categories
        db_categories = {}
        for cat_data in CATEGORIES:
            cat, _ = EventCategory.objects.get_or_create(
                slug=cat_data["slug"],
                defaults={"name": cat_data["name"], "icon": cat_data["icon"]},
            )
            db_categories[cat.slug] = cat

        # 2. Users & Profiles
        self.stdout.write("Setting up superuser...")
        if not User.objects.filter(username="root").exists():
            User.objects.create_superuser("root", "root@example.com", "root")
        else:
            su = User.objects.get(username="root")
            su.set_password("root")
            su.save()

        # 3 pure goers, 2 pure hosts, 3 vendors (who can also be goers/hosts)
        self.stdout.write("Creating users...")
        users = {}
        user_data = [
            ("goer1", "Alice", "Goer", "goer"),
            ("goer2", "Bob", "Attendee", "goer"),
            ("goer3", "Charlie", "Fan", "goer"),
            ("host1", "Diana", "Organizer", "host"),
            ("host2", "Eve", "Planner", "host"),
            ("vendor1", "Frank", "DJ", "vendor"),
            ("vendor2", "Grace", "Photographer", "vendor"),
            ("vendor3", "Heidi", "Caterer", "vendor"),
        ]

        for username, first, last, role in user_data:
            user = User.objects.create_user(
                username=username,
                email=f"{username}@example.com",
                password="password123",
                first_name=first,
                last_name=last,
            )
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.bio = f"Hi, I'm {first} and I love events!"
            profile.headline = f"Enthusiastic {role.capitalize()}"
            profile.location_city = "New York"

            # Using update to bypass ImageField validation for string URL
            UserProfile.objects.filter(pk=profile.pk).update(
                avatar=PLACEHOLDER_AVATAR, cover_photo=PLACEHOLDER_COVER
            )
            users[username] = user

        # 3. Vendor Services
        self.stdout.write("Creating vendor services...")
        services = []
        dj_service = VendorService.objects.create(
            vendor=users["vendor1"],
            title="DJ Frank's Beats",
            description="Premium DJ services for your events.",
            category="DJ",
            base_price=Decimal("500.00"),
            location_city="New York",
        )
        VendorService.objects.filter(pk=dj_service.pk).update(
            portfolio_image=PLACEHOLDER_PORTFOLIO
        )

        photo_service = VendorService.objects.create(
            vendor=users["vendor2"],
            title="Grace Photos",
            description="Capturing your best moments.",
            category="Photography",
            base_price=Decimal("300.00"),
            location_city="New York",
        )
        VendorService.objects.filter(pk=photo_service.pk).update(
            portfolio_image=PLACEHOLDER_PORTFOLIO
        )

        cater_service = VendorService.objects.create(
            vendor=users["vendor3"],
            title="Heidi's Catering",
            description="Delicious food for all.",
            category="Catering",
            base_price=Decimal("1000.00"),
            location_city="New York",
        )
        VendorService.objects.filter(pk=cater_service.pk).update(
            portfolio_image=PLACEHOLDER_PORTFOLIO
        )

        services.extend([dj_service, photo_service, cater_service])

        # 4. Recurring Series
        self.stdout.write("Creating event series...")
        series1 = EventSeries.objects.create(
            host=users["host1"],
            name="Weekly Tech Meetup",
            description="Learn tech every week.",
            recurrence_rule="FREQ=WEEKLY;BYDAY=WE",
            default_location_name="Tech Hub",
            default_capacity=50,
            default_ticket_price_standard=Decimal("10.00"),
        )
        EventSeriesNeedTemplate.objects.create(
            series=series1,
            title="Guest Speaker",
            category="Speaker",
            criticality="essential",
        )

        # 5. Events - Single & Recurrences representing all lifecycle states
        self.stdout.write("Creating events...")

        def create_event(
            title, host, status, l_state, start_offset_days, cat, series=None
        ):
            start = now + timedelta(days=start_offset_days)
            end = start + timedelta(hours=3)
            e = Event.objects.create(
                host=host,
                title=title,
                description=f"Description for {title}",
                category=cat,
                location_name="The Venue",
                location_address="123 Main St",
                start_time=start,
                end_time=end,
                capacity=100,
                ticket_price_standard=Decimal("20.00") if status != "draft" else None,
                status=status,
                lifecycle_state=l_state,
                series=series,
            )
            Event.objects.filter(pk=e.pk).update(cover_image=PLACEHOLDER_EVENT_IMG)
            return e

        events = {
            "draft": create_event(
                "Draft Party",
                users["host1"],
                "draft",
                "draft",
                30,
                db_categories["nightlife"],
            ),
            "published": create_event(
                "Published Concert",
                users["host2"],
                "published",
                "published",
                15,
                db_categories["music"],
            ),
            "at_risk": create_event(
                "At Risk Picnic",
                users["host1"],
                "published",
                "at_risk",
                2,
                db_categories["outdoors-adventure"],
            ),
            "postponed": create_event(
                "Postponed Workshop",
                users["host2"],
                "published",
                "postponed",
                45,
                db_categories["workshops-classes"],
            ),
            "event_ready": create_event(
                "Ready Festival",
                users["host1"],
                "published",
                "event_ready",
                1,
                db_categories["festivals"],
            ),
            "live": create_event(
                "Live Comedy Show",
                users["host2"],
                "published",
                "live",
                0,
                db_categories["comedy"],
            ),
            "completed": create_event(
                "Past Gala",
                users["host1"],
                "completed",
                "completed",
                -10,
                db_categories["networking-social"],
            ),
            "series_past": create_event(
                "Weekly Tech Meetup #1",
                users["host1"],
                "completed",
                "completed",
                -7,
                db_categories["tech-innovation"],
                series1,
            ),
            "series_upcoming": create_event(
                "Weekly Tech Meetup #2",
                users["host1"],
                "published",
                "published",
                7,
                db_categories["tech-innovation"],
                series1,
            ),
        }

        # Event Lifecycle Transitions
        for key, e in events.items():
            if e.lifecycle_state != "draft":
                EventLifecycleTransition.objects.create(
                    event=e,
                    from_state="draft",
                    to_state=e.lifecycle_state,
                    actor=e.host,
                    reason="Testing",
                )

        # 6. Needs, Applications, Invites
        self.stdout.write("Creating needs and applications...")
        # Need on published event
        need1 = EventNeed.objects.create(
            event=events["published"],
            title="Looking for DJ",
            category="DJ",
            budget_max=Decimal("600.00"),
        )
        NeedApplication.objects.create(
            need=need1,
            vendor=users["vendor1"],
            service=dj_service,
            proposed_price=Decimal("500.00"),
            status="accepted",
        )
        need1.assigned_vendor = users["vendor1"]
        need1.status = "filled"
        need1.save()

        # Need on live event
        need2 = EventNeed.objects.create(
            event=events["live"], title="Need Photographer", category="Photography"
        )
        NeedInvite.objects.create(
            need=need2,
            vendor=users["vendor2"],
            invited_by=users["host2"],
            message="Please apply!",
        )
        NeedApplication.objects.create(
            need=need2, vendor=users["vendor2"], service=photo_service, status="pending"
        )

        # 7. Tickets
        self.stdout.write("Creating tickets...")
        for goer in [users["goer1"], users["goer2"], users["goer3"]]:
            Ticket.objects.create(
                event=events["published"],
                goer=goer,
                ticket_type="standard",
                price_paid=Decimal("20.00"),
            )
            Ticket.objects.create(
                event=events["completed"],
                goer=goer,
                ticket_type="flexible",
                price_paid=Decimal("25.00"),
            )

        events["published"].ticket_count = 3
        events["published"].save()
        events["completed"].ticket_count = 3
        events["completed"].save()

        # 8. Highlights (on completed and live)
        self.stdout.write("Creating highlights & media...")
        h1 = EventHighlight.objects.create(
            event=events["completed"],
            author=users["goer1"],
            role="goer",
            text="Best gala ever!",
            moderation_status="approved",
        )
        EventHighlight.objects.filter(pk=h1.pk).update(media_file=PLACEHOLDER_EVENT_IMG)

        h2 = EventHighlight.objects.create(
            event=events["live"],
            author=users["host2"],
            role="host",
            text="We are live!",
            moderation_status="approved",
        )
        EventHighlight.objects.filter(pk=h2.pk).update(media_file=PLACEHOLDER_EVENT_IMG)

        # Event Media
        m1 = EventMedia.objects.create(
            event=events["completed"], media_type="image", category="highlight"
        )
        EventMedia.objects.filter(pk=m1.pk).update(file=PLACEHOLDER_EVENT_IMG)

        # 9. Reviews
        self.stdout.write("Creating reviews...")
        rev = EventReview.objects.create(
            event=events["completed"],
            reviewer=users["goer2"],
            rating=5,
            text="Fantastic experience.",
        )
        rev_m = EventReviewMedia.objects.create(review=rev)
        EventReviewMedia.objects.filter(pk=rev_m.pk).update(file=PLACEHOLDER_EVENT_IMG)

        # Vendor review attached to event
        EventVendorReview.objects.create(
            event_review=rev, vendor=cater_service, rating=4, text="Food was good."
        )

        # Standalone Vendor Review
        VendorReview.objects.create(
            vendor_service=dj_service,
            reviewer=users["goer3"],
            rating=5,
            text="Played all the right tracks.",
        )

        # 10. Interests and Views
        self.stdout.write("Creating interests and views...")
        EventInterest.objects.create(event=events["published"], user=users["goer3"])
        events["published"].interest_count = 1
        events["published"].save()

        EventView.objects.create(event=events["published"], user=users["goer1"])
        EventView.objects.create(event=events["completed"], user=users["goer2"])

        # 11. Requests
        self.stdout.write("Creating requests...")
        req = EventRequest.objects.create(
            requester=users["goer1"],
            title="Bring back the Retro 80s Party!",
            description="We need more 80s synth music nights.",
            category=db_categories["music"],
            location_city="New York",
            status="open",
        )
        RequestUpvote.objects.create(request=req, user=users["goer2"])
        RequestWishlist.objects.create(
            request=req, user=users["vendor1"], wishlist_as="vendor"
        )
        req.upvote_count = 1
        req.save()

        self.stdout.write(self.style.SUCCESS("Database seeded successfully!"))
