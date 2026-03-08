"""Modular user category tag system.

Tags are derived from user activity (tickets, hosted events, vendor services).
No database table — this is a computed "view" over existing data.

To add a new tag:
  1. Append a dict to BASE_TAGS (solo categories) or COMBO_TAGS (multi-category combos)
  2. For BASE_TAGS, provide a `check` key — a callable(ctx) -> bool
  3. For COMBO_TAGS, provide a `requires` key — a set of base tag IDs
"""

from apps.events.models import Event
from apps.tickets.models import Ticket
from apps.vendors.models import VendorService


# ---------------------------------------------------------------------------
# Base Tags — each evaluated independently against user activity context
# ---------------------------------------------------------------------------
BASE_TAGS = [
    {
        "id": "goer",
        "label": "Party Hopper",
        "icon": "party-popper",
        "color": "#fecaca",
        "emoji": "🎉",
        "priority": 10,
        "check": lambda ctx: ctx["attended_count"] > 0,
    },
    {
        "id": "host",
        "label": "Scene Setter",
        "icon": "tent",
        "color": "#e2e8f0",
        "emoji": "🎪",
        "priority": 10,
        "check": lambda ctx: ctx["hosted_count"] > 0,
    },
    {
        "id": "vendor",
        "label": "Hired Gun",
        "icon": "wrench",
        "color": "#fdba74",
        "emoji": "🔧",
        "priority": 10,
        "check": lambda ctx: ctx["vendor_count"] > 0,
    },
    {
        "id": "explorer",
        "label": "Fresh Face",
        "icon": "sprout",
        "color": "#bbf7d0",
        "emoji": "🌱",
        "priority": 5,
        "check": lambda ctx: (
            ctx["attended_count"] == 0
            and ctx["hosted_count"] == 0
            and ctx["vendor_count"] == 0
        ),
    },
]

# ---------------------------------------------------------------------------
# Combo Tags — awarded when a user holds multiple base tags simultaneously
# Ordered from most-specific (most requires) to least-specific.
# ---------------------------------------------------------------------------
COMBO_TAGS = [
    {
        "id": "triple_threat",
        "requires": {"goer", "host", "vendor"},
        "label": "Triple Threat",
        "icon": "crown",
        "color": "#fbbf24",
        "emoji": "👑",
        "priority": 30,
    },
    {
        "id": "life_of_party",
        "requires": {"goer", "host"},
        "label": "Life of the Party",
        "icon": "sparkles",
        "color": "#fef08a",
        "emoji": "🌟",
        "priority": 20,
    },
    {
        "id": "all_rounder",
        "requires": {"goer", "vendor"},
        "label": "All-Rounder",
        "icon": "sparkles",
        "color": "#d8b4fe",
        "emoji": "💫",
        "priority": 20,
    },
    {
        "id": "full_stack_fixer",
        "requires": {"host", "vendor"},
        "label": "Full Stack Fixer",
        "icon": "crosshair",
        "color": "#99f6e4",
        "emoji": "🎯",
        "priority": 20,
    },
]


def _build_activity_context(user):
    """Build the activity counts context for tag evaluation."""
    attended_count = Ticket.objects.filter(
        goer=user,
        status__in=["active", "used"],
    ).count()

    hosted_count = Event.objects.filter(
        host=user,
        lifecycle_state__in=Event.VISIBLE_LIFECYCLE_STATES,
    ).count()

    vendor_count = VendorService.objects.filter(
        vendor=user,
        is_active=True,
    ).count()

    return {
        "attended_count": attended_count,
        "hosted_count": hosted_count,
        "vendor_count": vendor_count,
    }


def get_user_tags(user):
    """Compute all tags for a user based on their activity.

    Returns a dict with:
        all_tags   — combined list of all possible tags, with an is_earned flag.
                     Combo tags appear first, followed by base tags.
    """
    ctx = _build_activity_context(user)

    # Evaluate base tags
    matched_base_ids = set()
    for tag in BASE_TAGS:
        if tag["check"](ctx):
            matched_base_ids.add(tag["id"])

    # Find the highest priority earned combo
    highest_combo_id = None
    highest_combo_priority = -1
    for combo in COMBO_TAGS:
        if combo["requires"].issubset(matched_base_ids):
            if combo["priority"] > highest_combo_priority:
                highest_combo_priority = combo["priority"]
                highest_combo_id = combo["id"]

    all_tags = []

    # Process combos (highest priority first)
    for combo in sorted(COMBO_TAGS, key=lambda c: c["priority"], reverse=True):
        t = _serialize_tag(combo)
        t["is_earned"] = (combo["id"] == highest_combo_id)
        
        # Build description for combos
        req_labels = [bt["label"] for bt in BASE_TAGS if bt["id"] in combo["requires"]]
        t["description"] = f"Requires {' + '.join(req_labels)}."
        if not t["is_earned"] and combo["requires"].issubset(matched_base_ids):
            t["description"] += " (Superseded by higher tier)"
            
        all_tags.append(t)

    # Process base tags
    for tag in sorted(BASE_TAGS, key=lambda t: t["priority"], reverse=True):
        t = _serialize_tag(tag)
        is_earned = (tag["id"] in matched_base_ids)
        t["is_earned"] = is_earned
        
        # Build dynamic descriptions for base tags
        if tag["id"] == "goer":
            count = ctx["attended_count"]
            t["description"] = f"Attended {count} event{'s' if count != 1 else ''}." if is_earned else "Needs to attend an event."
        elif tag["id"] == "host":
            count = ctx["hosted_count"]
            t["description"] = f"Hosted {count} event{'s' if count != 1 else ''}." if is_earned else "Needs to host an event."
        elif tag["id"] == "vendor":
            count = ctx["vendor_count"]
            t["description"] = f"Offers {count} service{'s' if count != 1 else ''}." if is_earned else "Needs to offer a service."
        elif tag["id"] == "explorer":
            t["description"] = "Brand new! No activity yet." if is_earned else "Has already started exploring!"
            
        all_tags.append(t)

    return {
        "all_tags": all_tags,
    }


def _serialize_tag(tag):
    """Return a JSON-safe dict for a tag (strips the check callable)."""
    return {
        "id": tag["id"],
        "label": tag["label"],
        "icon": tag["icon"],
        "color": tag["color"],
        "emoji": tag["emoji"],
        "priority": tag["priority"],
    }
