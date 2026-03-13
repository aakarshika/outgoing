import random

# Constants
PASSWORD_HASH = "'pbkdf2_sha256$1000000$VKbLmOhxxG1Zdh9Bp5fHj8$OJLeailf/xcBuCdoaUw/ldIKCWJYCWMVMyK+NOGk4F0='"

CATEGORIES = [
    (1, "Music", "music", "music"),
    (2, "Food & Drink", "food-drink", "utensils"),
    (3, "Nightlife", "nightlife", "moon"),
    (4, "Sports & Fitness", "sports-fitness", "dumbbell"),
    (5, "Arts & Culture", "arts-culture", "palette"),
    (6, "Tech & Innovation", "tech-innovation", "cpu"),
    (7, "Workshops & Classes", "workshops-classes", "book-open"),
    (8, "Outdoors & Adventure", "outdoors-adventure", "mountain"),
    (9, "Comedy", "comedy", "laugh"),
    (10, "Networking & Social", "networking-social", "users"),
    (11, "Festivals", "festivals", "party-popper"),
    (12, "Community", "community", "heart-handshake"),
]

CITIES = ["New York", "Los Angeles", "Chicago", "Houston", "Miami", "London", "Toronto"]

IMAGES = [
    "/assets/default-event-img.png",
]


def generate_sql():  # noqa: C901
    sql = []

    # 1. Wipe data
    sql.append(
        """-- seed_supabase.sql
-- Pure SQL seed script for Supabase
-- Can be run directly in the Supabase SQL Editor

-- 1. Wipe existing data
TRUNCATE auth_user,
         events_eventcategory,
         profiles_userprofile,
         vendors_vendorservice,
         events_eventseries,
         events_event,
         events_eventlifecycletransition,
         needs_eventneed,
         needs_needapplication,
         needs_needinvite,
         tickets_ticket,
         events_eventhighlight,
         events_eventmedia,
         events_eventreview,
         events_eventreviewmedia,
         events_eventvendorreview,
         vendors_vendorreview,
         events_eventinterest,
         events_eventview,
         requests_eventrequest,
         requests_requestupvote,
         requests_requestwishlist,
         events_eventseriesneedtemplate RESTART IDENTITY CASCADE;
"""
    )

    # 2. Categories
    sql.append("-- 2. Insert Categories")
    cat_inserts = []
    for c in CATEGORIES:
        cat_inserts.append(f"({c[0]}, '{c[1]}', '{c[2]}', '{c[3]}')")
    sql.append(
        "INSERT INTO events_eventcategory (id, name, slug, icon) VALUES \n"
        + ",\n".join(cat_inserts)
        + ";\n"
    )

    # 3. Users (20 normal + 1 root)
    sql.append("-- 3. Insert Users (auth_user)")
    user_inserts = []
    # Root user (id=1)
    user_inserts.append(
        f"(1, {PASSWORD_HASH}, true, 'root', 'root', 'root', 'root@root.com', true, true, NOW())"
    )

    first_names = [
        "Alice",
        "Bob",
        "Charlie",
        "Diana",
        "Eve",
        "Frank",
        "Grace",
        "Heidi",
        "Ivan",
        "Judy",
        "Karl",
        "Linda",
        "Mike",
        "Nancy",
        "Oscar",
        "Peggy",
        "Quinn",
        "Rupert",
        "Sybil",
        "Trent",
        "Uma",
        "Victor",
        "Wendy",
        "Xavier",
        "Yvonne",
        "Zack",
    ]
    last_names = [
        "Smith",
        "Johnson",
        "Williams",
        "Brown",
        "Jones",
        "Garcia",
        "Miller",
        "Davis",
        "Rodriguez",
        "Martinez",
    ]

    for i in range(2, 27):  # 25 normal users
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        username = f"user{i}"
        email = f"{username}@example.com"
        user_inserts.append(
            f"({i}, {PASSWORD_HASH}, false, '{username}', '{fn}', '{ln}', '{email}', false, true, NOW())"
        )

    sql.append(
        "INSERT INTO auth_user (id, password, is_superuser, username, first_name, last_name, email, is_staff, is_active, date_joined) VALUES\n"
        + ",\n".join(user_inserts)
        + ";\n"
    )

    # 4. Profiles
    sql.append("-- 4. Insert Profiles")
    profile_inserts = []
    for i in range(1, 27):
        city = random.choice(CITIES)
        profile_inserts.append(
            f"({i}, '555-{i:04d}', 'Hi, I love events', 'Enthusiastic User', '', 'https://placehold.co/150x150/png', 'https://placehold.co/800x400/png', '', '', true, false, true, true, true, true, true, '{city}', NOW(), NOW())"
        )
    sql.append(
        "INSERT INTO profiles_userprofile (user_id, phone_number, bio, headline, showcase_bio, avatar, cover_photo, aadhar_number, aadhar_image, privacy_name, privacy_email, privacy_hosted_events, privacy_serviced_events, privacy_events_attending, privacy_events_attended, allow_private_messages, location_city, created_at, updated_at) VALUES\n"
        + ",\n".join(profile_inserts)
        + ";\n"
    )

    # 5. Vendor Services
    sql.append("-- 5. Insert Vendor Services")
    vendor_inserts = []
    for i in range(1, 11):
        vendor_id = i + 5  # Users 6 to 15 are vendors
        category = random.choice(["DJ", "Photography", "Catering", "Security", "Decor"])
        city = random.choice(CITIES)
        price = random.randint(100, 1500)
        vendor_inserts.append(
            f"({i}, {vendor_id}, '{category} Services {i}', 'Premium {category} services', '{category}', 'customer_facing', {price}.00, 'https://placehold.co/800x600/png', '{city}', true, NOW(), NOW())"
        )
    sql.append(
        "INSERT INTO vendors_vendorservice (id, vendor_id, title, description, category, visibility, base_price, portfolio_image, location_city, is_active, created_at, updated_at) VALUES\n"
        + ",\n".join(vendor_inserts)
        + ";\n"
    )

    # 6. Event Series (Disabled per request)
    sql.append("-- 6. Insert Event Series (Disabled)")
    # event series disabled

    # 7. Events
    sql.append("-- 7. Insert Events")
    event_inserts = []
    statuses = ["draft", "published", "completed", "cancelled"]
    lifecycle = ["draft", "published", "live", "completed"]

    for i in range(1, 101):  # 100 events
        host_id = random.randint(2, 20)
        cat_id = random.randint(1, 12)
        days_offset = random.randint(-30, 30)  # Start and end between -1M and +1M
        created_days_offset = random.randint(-90, -30)  # Created between -3M and -1M
        city = random.choice(CITIES)
        status = random.choice(statuses)
        life = (
            random.choice(lifecycle)
            if status != "draft" and status != "cancelled"
            else status
        )
        price = random.randint(0, 50)

        start_time = f"NOW() + INTERVAL '{days_offset} days'"
        end_time = f"(NOW() + INTERVAL '{days_offset} days' + INTERVAL '3 hours')"
        created_at = f"NOW() + INTERVAL '{created_days_offset} days'"

        event_inserts.append(
            f"({i}, {host_id}, 'Event Title {i}', 'event-title-{i}', 'Description for event {i}', {cat_id}, NULL, NULL, 'Venue {i}', '123 {city} St', '', '', NULL, NULL, {start_time}, {end_time}, 100, {price}.00, NULL, 24, '{random.choice(IMAGES)}', '{status}', '{life}', '[]', '[]', {random.randint(0,20)}, {random.randint(0,50)}, {created_at}, {created_at})"
        )

    sql.append(
        "INSERT INTO events_event (id, host_id, title, slug, description, category_id, series_id, occurrence_index, location_name, location_address, check_in_instructions, event_ready_message, latitude, longitude, start_time, end_time, capacity, ticket_price_standard, ticket_price_flexible, refund_window_hours, cover_image, status, lifecycle_state, tags, features, interest_count, ticket_count, created_at, updated_at) VALUES\n"
        + ",\n".join(event_inserts)
        + ";\n"
    )

    # 8. Tickets
    sql.append("-- 8. Tickets")
    ticket_inserts = []
    for e in range(1, 101):
        num_tickets = random.randint(0, 10)
        goer_ids = random.sample(range(1, 27), num_tickets)
        for goer_id in goer_ids:
            price = random.randint(10, 50)
            ticket_inserts.append(
                f"({e}, {goer_id}, NULL, 'standard', 'gray', '', false, NULL, NULL, false, 100, NULL, {price}.00, 'active', NULL, NULL, NOW(), NOW())"
            )
    if ticket_inserts:
        sql.append(
            "INSERT INTO tickets_ticket (event_id, goer_id, tier_id, ticket_type, color, guest_name, is_18_plus, barcode, qr_secret, is_refundable, refund_percentage, refund_deadline, price_paid, status, used_at, admitted_by_id, purchased_at, updated_at) VALUES\n"
            + ",\n".join(ticket_inserts)
            + ";\n"
        )

    # 9. Needs & Apps
    sql.append("-- 9. Needs & Apps")
    need_inserts = []
    need_app_inserts = []
    need_id = 1
    for e in range(1, 101):
        if random.random() > 0.7:
            num_needs = random.randint(1, 3)
            for n in range(num_needs):
                vendor_id = random.randint(6, 15) if random.random() > 0.5 else "NULL"
                status = "filled" if vendor_id != "NULL" else "open"

                need_inserts.append(
                    f"({need_id}, {e}, 'Need {need_id}', '', 'Service', 'replaceable', NULL, 500.00, '{status}', {vendor_id}, 1, NOW())"
                )
                if vendor_id != "NULL":
                    service_id = vendor_id - 5
                    need_app_inserts.append(
                        f"({need_id}, {vendor_id}, {service_id}, 'I can do this!', 500.00, 'accepted', NULL, NULL, NULL, NULL, NOW())"
                    )
                need_id += 1

    if need_inserts:
        sql.append(
            "INSERT INTO needs_eventneed (id, event_id, title, description, category, criticality, budget_min, budget_max, status, assigned_vendor_id, application_count, created_at) VALUES\n"
            + ",\n".join(need_inserts)
            + ";\n"
        )
    if need_app_inserts:
        sql.append(
            "INSERT INTO needs_needapplication (need_id, vendor_id, service_id, message, proposed_price, status, barcode, qr_secret, admitted_at, admitted_by_id, created_at) VALUES\n"
            + ",\n".join(need_app_inserts)
            + ";\n"
        )

    # 10. Highlights
    sql.append("-- 10. Highlights")
    highlight_inserts = []
    for i in range(1, 151):  # 150 highlights
        event_id = random.randint(1, 100)
        author_id = random.randint(1, 26)
        role = random.choice(["goer", "host", "vendor"])
        text = f"Amazing moment {i}!"
        highlight_inserts.append(
            f"({i}, {event_id}, {author_id}, '{role}', '{text}', '{random.choice(IMAGES)}', 'approved', NOW())"
        )
    if highlight_inserts:
        sql.append(
            "INSERT INTO events_eventhighlight (id, event_id, author_id, role, text, media_file, moderation_status, created_at) VALUES\n"
            + ",\n".join(highlight_inserts)
            + ";\n"
        )

    # 11. Event Media
    sql.append("-- 11. Event Media")
    media_inserts = []
    for i in range(1, 201):  # 200 media items
        event_id = random.randint(1, 100)
        category = random.choice(["highlight", "gallery"])
        media_inserts.append(
            f"({event_id}, 'image', '{category}', '{random.choice(IMAGES)}', {random.randint(0, 5)}, NOW())"
        )
    if media_inserts:
        sql.append(
            'INSERT INTO events_eventmedia (event_id, media_type, category, file, "order", created_at) VALUES\n'
            + ",\n".join(media_inserts)
            + ";\n"
        )

    # 12. Reviews
    sql.append("-- 12. Reviews")
    review_inserts = []
    review_media_inserts = []
    event_vendor_review_inserts = []
    vendor_review_inserts = []

    used_review_pairs = set()
    for i in range(1, 151):  # 150 reviews
        event_id = random.randint(1, 100)
        reviewer_id = random.randint(1, 26)
        while (event_id, reviewer_id) in used_review_pairs:
            event_id = random.randint(1, 100)
            reviewer_id = random.randint(1, 26)
        used_review_pairs.add((event_id, reviewer_id))

        rating = random.choice([4, 5, 5, 5, 3])
        review_inserts.append(
            f"({i}, {event_id}, {reviewer_id}, {rating}, 'Great event {i}', true, NOW())"
        )

        if random.random() > 0.7:
            review_media_inserts.append(f"({i}, '{random.choice(IMAGES)}', NOW())")

        if random.random() > 0.8:
            vendor_service_id = random.randint(1, 10)
            event_vendor_review_inserts.append(
                f"({i}, {vendor_service_id}, {rating}, 'Good vendor {i}', NOW())"
            )

    used_vendor_review_pairs = set()
    for i in range(1, 51):
        service_id = random.randint(1, 10)
        reviewer_id = random.randint(1, 26)
        while (service_id, reviewer_id) in used_vendor_review_pairs:
            service_id = random.randint(1, 10)
            reviewer_id = random.randint(1, 26)
        used_vendor_review_pairs.add((service_id, reviewer_id))
        vendor_review_inserts.append(
            f"({service_id}, {reviewer_id}, NULL, 5, 'Great service!', true, NOW())"
        )

    if review_inserts:
        sql.append(
            "INSERT INTO events_eventreview (id, event_id, reviewer_id, rating, text, is_public, created_at) VALUES\n"
            + ",\n".join(review_inserts)
            + ";\n"
        )
    if review_media_inserts:
        sql.append(
            "INSERT INTO events_eventreviewmedia (review_id, file, created_at) VALUES\n"
            + ",\n".join(review_media_inserts)
            + ";\n"
        )
    if event_vendor_review_inserts:
        sql.append(
            "INSERT INTO events_eventvendorreview (event_review_id, vendor_id, rating, text, created_at) VALUES\n"
            + ",\n".join(event_vendor_review_inserts)
            + ";\n"
        )
    if vendor_review_inserts:
        sql.append(
            "INSERT INTO vendors_vendorreview (vendor_service_id, reviewer_id, event_id, rating, text, is_public, created_at) VALUES\n"
            + ",\n".join(vendor_review_inserts)
            + ";\n"
        )

    # 13. Requests
    sql.append("-- 13. Requests")
    request_inserts = []
    upvote_inserts = []
    wishlist_inserts = []
    for i in range(1, 31):
        requester_id = random.randint(1, 26)
        cat_id = random.randint(1, 12)
        city = random.choice(CITIES)
        upvotes = random.randint(0, 10)
        request_inserts.append(
            f"({i}, {requester_id}, 'Request {i}', 'Need {i}', {cat_id}, '{city}', {upvotes}, NULL, 'open', NOW())"
        )

        upvote_uids = random.sample(range(1, 27), upvotes)
        for uid in upvote_uids:
            upvote_inserts.append(f"({i}, {uid}, NOW())")

        if random.random() > 0.5:
            uid = random.randint(6, 15)
            wishlist_inserts.append(f"({i}, {uid}, 'vendor', NOW())")

    if request_inserts:
        sql.append(
            "INSERT INTO requests_eventrequest (id, requester_id, title, description, category_id, location_city, upvote_count, fulfilled_event_id, status, created_at) VALUES\n"
            + ",\n".join(request_inserts)
            + ";\n"
        )
    if upvote_inserts:
        sql.append(
            "INSERT INTO requests_requestupvote (request_id, user_id, created_at) VALUES\n"
            + ",\n".join(upvote_inserts)
            + ";\n"
        )
    if wishlist_inserts:
        sql.append(
            "INSERT INTO requests_requestwishlist (request_id, user_id, wishlist_as, created_at) VALUES\n"
            + ",\n".join(wishlist_inserts)
            + ";\n"
        )

    return "\n".join(sql)


if __name__ == "__main__":
    with open("/Users/aakarshika/Dev/outgoing/backend/seed_supabase.sql", "w") as f:
        f.write(generate_sql())
    print("Succesfully rewrote seed_supabase.sql with large mock seed data!")
