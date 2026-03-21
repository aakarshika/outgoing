# Generated manually for non-interactive migration of Friendship.orbit_category

import django.db.models.deletion
from django.db import migrations, models


def backfill_friendship_orbit_category(apps, schema_editor):
    Friendship = apps.get_model("events", "Friendship")
    Event = apps.get_model("events", "Event")
    EventCategory = apps.get_model("events", "EventCategory")

    fallback, _ = EventCategory.objects.get_or_create(
        slug="orbit-unknown",
        defaults={"name": "Orbit Unknown", "icon": "Orbit"},
    )

    for friendship in Friendship.objects.all().iterator():
        cat_id = None
        if friendship.met_at_event_id:
            try:
                event = Event.objects.get(pk=friendship.met_at_event_id)
                if event.category_id:
                    cat_id = event.category_id
            except Event.DoesNotExist:
                pass
        if cat_id is None:
            cat_id = fallback.pk
        Friendship.objects.filter(pk=friendship.pk).update(orbit_category_id=cat_id)


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("events", "0021_eventaddon"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="friendship",
            name="unique_friendship_pair",
        ),
        migrations.AddField(
            model_name="friendship",
            name="orbit_category",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="friendships",
                to="events.eventcategory",
            ),
        ),
        migrations.RunPython(backfill_friendship_orbit_category, noop_reverse),
        migrations.AlterField(
            model_name="friendship",
            name="orbit_category",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="friendships",
                to="events.eventcategory",
            ),
        ),
        migrations.AddConstraint(
            model_name="friendship",
            constraint=models.UniqueConstraint(
                fields=("user1", "user2", "orbit_category"),
                name="unique_friendship_pair",
            ),
        ),
    ]
