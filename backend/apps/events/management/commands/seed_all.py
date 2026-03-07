from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.events.models import (
    Event,
    EventCategory,
    EventHighlight,
    EventInterest,
    EventLifecycleTransition,
    EventMedia,
    EventReview,
    EventReviewMedia,
    EventSeries,
    EventSeriesNeedTemplate,
    EventTicketTier,
    EventVendorReview,
    EventView,
)
from apps.needs.models import EventNeed, NeedApplication, NeedInvite
from apps.profiles.models import UserProfile
from apps.requests.models import EventRequest, RequestUpvote, RequestWishlist
from apps.tickets.models import Ticket
from apps.vendors.models import VendorReview, VendorService

User = get_user_model()

PLACEHOLDER_AVATAR = "https://placehold.co/150x150/png"
PLACEHOLDER_COVER = "https://placehold.co/800x400/png"
PLACEHOLDER_EVENT_IMG = "https://placehold.co/600x400/png"
PLACEHOLDER_PORTFOLIO = "https://placehold.co/800x600/png"

CATEGORIES = [
    {"id": 5, "name": "Arts & Culture", "slug": "arts-culture", "icon": "palette"},
    {"id": 9, "name": "Comedy", "slug": "comedy", "icon": "laugh"},
    {"id": 12, "name": "Community", "slug": "community", "icon": "heart-handshake"},
    {"id": 11, "name": "Festivals", "slug": "festivals", "icon": "party-popper"},
    {"id": 2, "name": "Food & Drink", "slug": "food-drink", "icon": "utensils"},
    {"id": 1, "name": "Music", "slug": "music", "icon": "music"},
    {
        "id": 10,
        "name": "Networking & Social",
        "slug": "networking-social",
        "icon": "users",
    },
    {"id": 3, "name": "Nightlife", "slug": "nightlife", "icon": "moon"},
    {
        "id": 8,
        "name": "Outdoors & Adventure",
        "slug": "outdoors-adventure",
        "icon": "mountain",
    },
    {"id": 4, "name": "Sports & Fitness", "slug": "sports-fitness", "icon": "dumbbell"},
    {"id": 6, "name": "Tech & Innovation", "slug": "tech-innovation", "icon": "cpu"},
    {
        "id": 7,
        "name": "Workshops & Classes",
        "slug": "workshops-classes",
        "icon": "book-open",
    },
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
        EventTicketTier.objects.all().delete()
        UserProfile.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        # Note: Categories are not wiped by default unless needed, but we can leave them
        self.stdout.write(self.style.SUCCESS("Data wiped successfully."))

    @transaction.atomic
    def handle(self, *args, **options):  # noqa: C901
        if not options["no_wipe"]:
            self.wipe_data()

        now = timezone.now()

        # 1. Categories
        db_categories = {}
        for cat_data in CATEGORIES:
            cat, _ = EventCategory.objects.update_or_create(
                slug=cat_data["slug"],
                defaults={
                    "name": cat_data["name"],
                    "icon": cat_data["icon"],
                },
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

        # Diverse users including mixed roles
        self.stdout.write("Creating users...")
        users = {}
        user_data = []

        # Pure Goers
        for i in range(1, 11):
            user_data.append((f"goer{i}", f"Goer{i}", "Lastname", "goer"))

        # Pure Hosts
        for i in range(1, 4):
            user_data.append((f"host{i}", f"Host{i}", "Lastname", "host"))

        # Pure Vendors
        for i in range(1, 6):
            user_data.append((f"vendor{i}", f"Vendor{i}", "Lastname", "vendor"))

        # Host + Goer
        for i in range(1, 4):
            user_data.append(
                (f"hostgoer{i}", f"HostGoer{i}", "Lastname", "host and goer")
            )

        # Vendor + Goer
        for i in range(1, 4):
            user_data.append(
                (f"vendorgoer{i}", f"VendorGoer{i}", "Lastname", "vendor and goer")
            )

        # Host + Vendor
        for i in range(1, 3):
            user_data.append(
                (f"hostvendor{i}", f"HostVendor{i}", "Lastname", "host and vendor")
            )

        # All three
        for i in range(1, 4):
            user_data.append((f"omni{i}", f"Omni{i}", "Lastname", "event enthusiast"))

        for username, first, last, role in user_data:
            user = User.objects.create_user(
                username=username,
                email=f"{username}@example.com",
                password="password123",
                first_name=first,
                last_name=last,
            )
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.bio = f"Hi, I'm {first} and I'm a passionate {role}."
            profile.headline = f"Professional {role.capitalize()}"
            profile.location_city = "New York" if i % 2 == 0 else "Los Angeles"
            profile.phone_number = f"555-01{i:02d}"
            profile.showcase_bio = f"Detailed showcase bio for {first}. This {role} has a lot of experience in the event industry and loves connecting with others."

            # Using update to bypass ImageField validation for string URL
            UserProfile.objects.filter(pk=profile.pk).update(
                avatar=PLACEHOLDER_AVATAR, cover_photo=PLACEHOLDER_COVER
            )
            users[username] = user

        all_hosts = [
            u
            for u in users.values()
            if any(role in u.username for role in ["host", "omni"])
        ]
        all_vendors = [
            u
            for u in users.values()
            if any(role in u.username for role in ["vendor", "omni"])
        ]
        all_goers = [
            u
            for u in users.values()
            if any(role in u.username for role in ["goer", "omni"])
        ]

        # Vendor services: ensure every vendor-capable user has at least one service
        self.stdout.write("Creating vendor services...")
        services = []
        vendor_types = [
            ("dj", "Beats & Rhythms", "Premium audio experiences."),
            ("photography", "Lens & Light", "Capturing every moment."),
            ("catering", "Gourmet Bites", "Exquisite culinary delights."),
            ("staffing", "Safe Guard", "Professional security & staffing services."),
            (
                "decor_floristry",
                "Ambient Designs",
                "Transforming spaces with stunning decor.",
            ),
            ("lighting_audio", "Bright Star", "Dynamic event lighting & AV."),
            ("videography", "Visual Tech", "State-of-the-art video production."),
            ("food_truck", "Street Flavor", "Delicious food truck experiences."),
            ("bartending", "Mix Master", "Craft cocktails and bar service."),
            (
                "event_planning",
                "Plan Perfect",
                "Full-service event planning & coordination.",
            ),
        ]
        service_count = max(len(all_vendors), len(vendor_types))
        for i in range(service_count):
            cat, title_prefix, desc = vendor_types[i % len(vendor_types)]
            vendor_user = all_vendors[i % len(all_vendors)]
            service = VendorService.objects.create(
                vendor=vendor_user,
                title=f"{title_prefix} by {vendor_user.first_name}",
                description=desc,
                category=cat,
                base_price=Decimal(str(100 * (i + 1))),
                location_city="New York" if (i + 1) % 2 == 0 else "Los Angeles",
            )
            VendorService.objects.filter(pk=service.pk).update(
                portfolio_image=PLACEHOLDER_PORTFOLIO
            )
            services.append(service)

        # 4. Recurring Series
        self.stdout.write("Creating event series...")
        series1 = EventSeries.objects.create(
            host=all_hosts[0],
            name="Weekly Tech Meetup",
            description="Learn tech every week.",
            recurrence_rule="FREQ=WEEKLY;BYDAY=WE",
            default_location_name="Tech Hub",
            default_capacity=50,
        )
        EventSeriesNeedTemplate.objects.create(
            series=series1,
            title="Guest Speaker",
            category="mc_host",
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
                description=f"A spectacular {cat.name} event. {title} features top-tier entertainment and a great atmosphere.",
                category=cat,
                location_name=f"{title} Venue",
                location_address=f"{100 + start_offset_days} Event Ave",
                start_time=start,
                end_time=end,
                capacity=100 + abs(start_offset_days),
                status=status,
                lifecycle_state=l_state,
                series=series,
                latitude=Decimal("40.7128") + Decimal(str(start_offset_days * 0.001)),
                longitude=Decimal("-74.0060") + Decimal(str(start_offset_days * 0.001)),
                tags=["exciting", cat.slug, "featured"],
                check_in_instructions="Please have your digital ticket ready at the entrance.",
                event_ready_message="The event is starting soon! Get ready for an amazing experience.",
            )
            Event.objects.filter(pk=e.pk).update(cover_image=PLACEHOLDER_EVENT_IMG)
            
            # Create standard tiers for every event
            EventTicketTier.objects.create(
                event=e,
                name="Early Bird",
                description="Limited early bird tickets.",
                price=Decimal("15.00"),
                capacity=20,
                color="#e0f2fe", # light blue
                is_refundable=False
            )
            EventTicketTier.objects.create(
                event=e,
                name="General Admission",
                description="Standard entry to the event.",
                price=Decimal("25.00"),
                capacity=None,
                color="#fef3c7", # amber
                is_refundable=True,
                refund_percentage=100
            )
            EventTicketTier.objects.create(
                event=e,
                name="VIP Lounge",
                description="Exclusive access to the VIP lounge and perks.",
                price=Decimal("75.00"),
                capacity=10,
                color="#fae8ff", # fuchsia
                is_refundable=True,
                refund_percentage=50
            )
            return e

        events = {}
        # Create events for each category and various lifecycle states
        cat_list = [db_categories[cat_data["slug"]] for cat_data in CATEGORIES]
        for i, cat in enumerate(cat_list):
            host = all_hosts[i % len(all_hosts)]

            # Mix up statuses and offsets
            if i % 7 == 0:
                state, status, offset = "draft", "draft", 30 + i
            elif i % 7 == 1:
                state, status, offset = "published", "published", 15 + i
            elif i % 7 == 2:
                state, status, offset = "at_risk", "published", 2 + i
            elif i % 7 == 3:
                state, status, offset = "postponed", "published", 45 + i
            elif i % 7 == 4:
                state, status, offset = "event_ready", "published", 1 + i
            elif i % 7 == 5:
                state, status, offset = "live", "published", 0
            else:
                state, status, offset = "completed", "completed", -10 - i

            event_key = f"event_{i}"
            events[event_key] = create_event(
                f"Big {cat.name} Bash {i}", host, status, state, offset, cat
            )

        # Add a couple of series events
        events["series_past"] = create_event(
            "Weekly Tech Meetup #1",
            all_hosts[0],
            "completed",
            "completed",
            -7,
            db_categories["tech-innovation"],
            series1,
        )
        events["series_upcoming"] = create_event(
            "Weekly Tech Meetup #2",
            all_hosts[0],
            "published",
            "published",
            7,
            db_categories["tech-innovation"],
            series1,
        )

        # Event Lifecycle Transitions
        for e in events.values():
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
        # Add needs to diverse events
        needs_list = []
        for i, e in enumerate(list(events.values())[:10]):
            vendor_user = all_vendors[i % len(all_vendors)]
            service = services[i % len(services)]

            need = EventNeed.objects.create(
                event=e,
                title=f"Need for {service.category}",
                category=service.category,
                budget_max=service.base_price * Decimal("1.2"),
                status="filled" if i % 2 == 0 else "open",
            )
            needs_list.append(need)

            if need.status == "filled":
                NeedApplication.objects.create(
                    need=need,
                    vendor=vendor_user,
                    service=service,
                    proposed_price=service.base_price,
                    status="accepted",
                )
                need.assigned_vendor = vendor_user
                need.save()
            else:
                # Add a few applications and invites for open needs
                for j in range(1, 3):
                    v_idx = (i + j) % len(all_vendors)
                    NeedApplication.objects.create(
                        need=need,
                        vendor=all_vendors[v_idx],
                        service=services[(i + j) % len(services)],
                        status="pending",
                    )
                    NeedInvite.objects.create(
                        need=need,
                        vendor=all_vendors[v_idx],
                        invited_by=e.host,
                        message=f"Hey vendor, we'd love for you to join {e.title}!",
                    )

        # 7. Tickets
        self.stdout.write("Creating tickets...")
        for i, (key, e) in enumerate(events.items()):
            if e.status in ["published", "completed", "live"]:
                # Each event gets 5-10 tickets
                num_tickets = 5 + (i % 6)
                tiers = list(e.ticket_tiers.all())
                for j in range(num_tickets):
                    goer = all_goers[(i + j) % len(all_goers)]
                    tier = tiers[j % len(tiers)]
                    Ticket.objects.get_or_create(
                        event=e,
                        goer=goer,
                        tier=tier,
                        defaults={
                            "ticket_type": tier.name,
                            "price_paid": tier.price,
                            "color": tier.color,
                            "is_refundable": tier.is_refundable,
                            "refund_percentage": tier.refund_percentage,
                        },
                    )
                e.ticket_count = num_tickets
                e.save()

        # 9. Reviews (Many reviews for completed events)
        self.stdout.write("Creating reviews and highlights...")
        completed_events = [e for e in events.values() if e.status == "completed"]
        for i, e in enumerate(completed_events):
            # Highlights
            for j in range(1, 4):
                author = all_goers[(j + i) % len(all_goers)]
                h = EventHighlight.objects.create(
                    event=e,
                    author=author,
                    role="goer",
                    text=f"Check out this moment from {e.title}! Highlight #{j}",
                    moderation_status="approved",
                )
                EventHighlight.objects.filter(pk=h.pk).update(
                    media_file=PLACEHOLDER_EVENT_IMG
                )

            # Event Media Gallery
            for j in range(1, 5):
                m = EventMedia.objects.create(
                    event=e,
                    media_type="image" if j % 2 == 0 else "video",
                    category="gallery",
                    order=j,
                )
                EventMedia.objects.filter(pk=m.pk).update(file=PLACEHOLDER_EVENT_IMG)

        def random_rating(seed):
            return 3 + (seed % 3)

        # Reviews
        for i, e in enumerate(completed_events):
            for j in range(1, 6):
                reviewer = all_goers[(j + i * 5) % len(all_goers)]
                rev = EventReview.objects.create(
                    event=e,
                    reviewer=reviewer,
                    rating=random_rating(j),
                    text=f"Review #{j} for {e.title}: An absolutely wonderful experience!",
                )
                rev_m = EventReviewMedia.objects.create(review=rev)
                EventReviewMedia.objects.filter(pk=rev_m.pk).update(
                    file=PLACEHOLDER_EVENT_IMG
                )

                # Vendor review for the service provided at this event (if any needs were filled)
                for need in e.needs.filter(status="filled"):
                    EventVendorReview.objects.create(
                        event_review=rev,
                        vendor=need.applications.filter(status="accepted")
                        .first()
                        .service,
                        rating=random_rating(j),
                        text="The vendor did a great job!",
                    )

        # Standalone Vendor Reviews
        for i, s in enumerate(services):
            for j in range(1, 4):
                reviewer = all_goers[(j + i * 3) % len(all_goers)]
                VendorReview.objects.create(
                    vendor_service=s,
                    reviewer=reviewer,
                    rating=random_rating(j),
                    text=f"Service review for {s.title}: Highly professional and recommended.",
                )

        # 10. Interests and Views
        self.stdout.write("Creating interests and views...")
        for i, (key, e) in enumerate(events.items()):
            # Each event gets some views and interests
            for j in range(1, 6):
                user = all_goers[(i + j) % len(all_goers)]
                if j % 2 == 0:
                    EventInterest.objects.get_or_create(event=e, user=user)
                    e.interest_count += 1
                EventView.objects.get_or_create(event=e, user=user)
            e.save()

        # 11. Requests
        self.stdout.write("Creating requests...")
        for i in range(1, 6):
            cat = cat_list[i % len(cat_list)]
            req = EventRequest.objects.create(
                requester=all_goers[i % len(all_goers)],
                title=f"Request for more {cat.name} events in the city!",
                description=f"I really love {cat.name} and we need more of them. Specifically, events that are {cat.slug} focused.",
                category=cat,
                location_city="New York" if i % 2 == 0 else "Los Angeles",
                status="open" if i < 4 else "fulfilled",
                fulfilled_event=events[f"event_{i}"] if i >= 4 else None,
            )
            # Add upvotes
            for j in range(1, 5):
                upvoter = all_goers[(i + j) % len(all_goers)]
                RequestUpvote.objects.get_or_create(request=req, user=upvoter)
                req.upvote_count += 1

            # Add wishlist
            RequestWishlist.objects.create(
                request=req,
                user=all_vendors[i % len(all_vendors)],
                wishlist_as="vendor",
            )
            req.save()

        self.stdout.write(self.style.SUCCESS("Database seeded successfully!"))
