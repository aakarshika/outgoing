import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("events", "0018_eventprivateconversation_eventprivatemessage"),
    ]

    operations = [
        migrations.AlterField(
            model_name="eventprivateconversation",
            name="event",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="private_conversations",
                to="events.event",
            ),
        ),
        migrations.AlterUniqueTogether(
            name="eventprivateconversation",
            unique_together=set(),
        ),
        migrations.AddConstraint(
            model_name="eventprivateconversation",
            constraint=models.UniqueConstraint(
                fields=("participant1", "participant2"),
                name="unique_direct_conversation_pair",
            ),
        ),
    ]
