# Seed Data Analysis

This document provides a breakdown of the seed data structure expected by `seed_all.py`, evaluating randomizability for each table and column, followed by an example seed JSON payload.

## Data Dictionary & Randomization

| Table | Column | Data Type | Can it be seeded by using Random under some conditions? |
| :--- | :--- | :--- | :--- |
| **`users`** | `username` | string | Yes (e.g., `Faker.user_name()`) |
| | `email` | string | Yes (e.g., `Faker.email()`) |
| | `password` | string | Yes (or constant like `"password123"` for easy login) |
| | `first_name` | string | Yes |
| | `last_name` | string | Yes |
| | `is_staff` | boolean | Yes (weighted heavily towards `false`) |
| | `is_superuser` | boolean | No (usually kept to designated admins only) |
| | `is_active` | boolean | Yes (mostly `true`) |
| **`profiles`** | `user` | string (ref) | Yes (randomly select from seeded users) |
| | `phone_number` | string | Yes |
| | `bio` | string | Yes (e.g., text/paragraphs) |
| | `headline` | string | Yes |
| | `showcase_bio` | string | Yes |
| | `aadhar_number` | string | Yes (numeric string) |
| | `privacy_*` | boolean | Yes (random boolean distributions) |
| | `location_city` | string | Yes (e.g., `Faker.city()`) |
| | `avatar` / `cover_photo` | string (path) | Yes (pick random placeholder image paths) |
| **`categories`** | `slug` | string | No (usually fixed taxonomy, e.g., "music", "tech") |
| | `name` | string | No (matches slug taxonomy) |
| | `icon` | string | No (matches taxonomy icons) |
| **`services`** | `key` | string (id) | Yes (unique identifier string / UUID) |
| | `vendor` | string (ref) | Yes (pick from users acting as vendors) |
| | `title` | string | Yes |
| | `description` | string | Yes |
| | `category` | string | Yes (from category taxonomy) |
| | `visibility` | string (choice) | Yes |
| | `base_price` | decimal | Yes (random monetary values) |
| | `location_city` | string | Yes |
| | `is_active` | boolean | Yes |
| **`series`** | `key` | string (id) | Yes |
| | `host` | string (ref) | Yes (pick from users acting as hosts) |
| | `name` | string | Yes |
| | `recurrence_rule` | string | Yes (valid random strings like frequency) |
| | `default_capacity` | integer | Yes |
| | *Various defaults* | mixed | Yes |
| **`series_need_templates`** | `series` | string (ref) | Yes |
| | `title` | string | Yes |
| | `budget_min` / `max` | decimal | Yes |
| | `criticality` | string (choice) | Yes |
| **`events`** | `key` | string (id) | Yes |
| | `host` | string (ref) | Yes |
| | `category` | string (ref) | Yes (pick from seeded categories) |
| | `title` | string | Yes |
| | `start_time` / `end_time` | string (iso dt) | Yes (relative offsets from `now()`) |
| | `status` | string (choice) | Yes (e.g., `'draft'`, `'published'`) |
| | `lifecycle_state` | string (choice)| Yes |
| | `capacity` | integer | Yes |
| | `ticket_price_*` | decimal | Yes |
| | `latitude` / `longitude` | decimal | Yes (e.g., coordinate generation) |
| **`event_lifecycle_transitions`**| `event` | string (ref) | Yes |
| | `from_state`/`to_state` | string (choice)| Yes |
| | `actor` | string (ref) | Yes |
| **`event_ticket_tiers`** | `key` | string (id) | Yes |
| | `event` | string (ref) | Yes |
| | `name` | string | Yes (e.g., VIP, General) |
| | `price` | decimal | Yes |
| | `capacity` | integer | Yes |
| **`event_needs`** | `key` | string (id) | Yes |
| | `event` | string (ref) | Yes |
| | `title` | string | Yes |
| | `status` | string (choice) | Yes |
| | `criticality` | string (choice) | Yes |
| | `assigned_vendor` | string (ref) | Yes (or null) |
| **`need_applications`** | `key` | string (id) | Yes |
| | `need` | string (ref) | Yes |
| | `vendor` | string (ref) | Yes |
| | `proposed_price` | decimal | Yes |
| | `status` | string (choice) | Yes |
| **`need_invites`** | `need` | string (ref) | Yes |
| | `vendor` | string (ref) | Yes |
| | `invited_by` | string (ref) | Yes |
| | `status` | string (choice) | Yes |
| **`tickets`** | `event` | string (ref) | Yes |
| | `goer` | string (ref) | Yes (user purchasing ticket) |
| | `tier` | string (ref) | Yes |
| | `status` | string (choice) | Yes |
| | `ticket_type` | string | Yes |
| | `price_paid` | decimal | Yes |
| **`event_media`** | `event` | string (ref) | Yes |
| | `file` | string (path) | Yes (from predefined images) |
| | `media_type` | string (choice) | Yes |
| **`event_highlights`** | `key` | string (id) | Yes |
| | `event` | string (ref) | Yes |
| | `author` | string (ref) | Yes |
| | `text` | string | Yes |
| **`event_highlight_likes`** | `highlight` | string (ref) | Yes |
| | `user` | string (ref) | Yes |
| **`event_highlight_comments`** | `key` | string (id) | Yes |
| | `highlight` | string (ref) | Yes |
| | `author` | string (ref) | Yes |
| | `text` | string | Yes |
| **`event_reviews`** | `key` | string (id) | Yes |
| | `event` | string (ref) | Yes |
| | `reviewer` | string (ref) | Yes |
| | `rating` | integer | Yes (1 to 5) |
| | `text` | string | Yes |
| **`event_vendor_reviews`** | `event_review` | string (ref) | Yes |
| | `vendor_service` | string (ref) | Yes |
| | `rating` | integer | Yes (1 to 5) |
| **`vendor_reviews`** | `vendor_service` | string (ref) | Yes |
| | `reviewer` | string (ref) | Yes |
| | `rating` | integer | Yes (1 to 5) |
| **`event_interests` \ `event_views`** | `event` / `user` | string (ref) | Yes (many-to-many random population) |
| **`event_requests`** | `key` | string (id) | Yes |
| | `requester` | string (ref) | Yes |
| | `title` | string | Yes |
| | `status` | string (choice) | Yes |
| **`request_upvotes`** | `request` | string (ref) | Yes |
| | `user` | string (ref) | Yes |
| **`request_wishlists`** | `request` | string (ref) | Yes |
| | `user` | string (ref) | Yes |
| | `wishlist_as` | string (choice) | Yes |


---

## Example JSON Payload

This is what a concise generated JSON structure looks like based on the above mapping:

```json
{
  "users": [
    {
      "username": "host_user",
      "email": "host@example.com",
      "password": "password123",
      "first_name": "Anna",
      "last_name": "Host",
      "is_active": true
    },
    {
      "username": "goer_user",
      "email": "goer@example.com",
      "password": "password123",
      "first_name": "Mark",
      "last_name": "Goer",
      "is_active": true
    }
  ],
  "profiles": [
    {
      "user": "host_user",
      "phone_number": "555-1234",
      "bio": "I love hosting community events.",
      "location_city": "Austin"
    }
  ],
  "categories": [
    {
      "slug": "music",
      "name": "Live Music",
      "icon": "music-note"
    }
  ],
  "events": [
    {
      "key": "event_1",
      "host": "host_user",
      "category": "music",
      "title": "Acoustic Night",
      "description": "Join us for an evening of acoustic music.",
      "location_name": "The Local Pub",
      "start_time": "2026-06-01T19:00:00Z",
      "end_time": "2026-06-01T23:00:00Z",
      "status": "published",
      "lifecycle_state": "published",
      "capacity": 100,
      "ticket_price_standard": 15.00
    }
  ],
  "event_ticket_tiers": [
    {
      "key": "tier_general_1",
      "event": "event_1",
      "name": "General Admission",
      "price": 15.00,
      "capacity": 80
    }
  ],
  "event_views": [
    {
      "event": "event_1",
      "user": "goer_user"
    }
  ],
  "tickets": [
    {
      "event": "event_1",
      "goer": "goer_user",
      "tier": "tier_general_1",
      "status": "active",
      "price_paid": 15.00
    }
  ],
  "event_reviews": [
    {
      "key": "review_1",
      "event": "event_1",
      "reviewer": "goer_user",
      "rating": 5,
      "text": "Amazing acoustic performance!"
    }
  ]
}
```
