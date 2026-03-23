"""Migration operations that touch models in other apps.

Used to break the events ↔ vendors dependency cycle while keeping **one**
migration file per app: ``VendorReview`` is created in ``vendors.0001`` without
``event``; ``events.0001`` adds that FK after ``Event`` exists.
"""

from django.db import migrations
from django.db.models import NOT_PROVIDED


class AddFieldVendors(migrations.AddField):
    """Like ``AddField``, but always applies to ``vendors.<model_name>``."""

    target_app_label = "vendors"

    def state_forwards(self, app_label, state):
        state.add_field(
            self.target_app_label,
            self.model_name_lower,
            self.name,
            self.field,
            self.preserve_default,
        )

    def database_forwards(self, app_label, schema_editor, from_state, to_state):
        tgt = self.target_app_label
        to_model = to_state.apps.get_model(tgt, self.model_name)
        if self.allow_migrate_model(schema_editor.connection.alias, to_model):
            from_model = from_state.apps.get_model(tgt, self.model_name)
            field = to_model._meta.get_field(self.name)
            if not self.preserve_default:
                field.default = self.field.default
            schema_editor.add_field(from_model, field)
            if not self.preserve_default:
                field.default = NOT_PROVIDED

    def database_backwards(self, app_label, schema_editor, from_state, to_state):
        tgt = self.target_app_label
        from_model = from_state.apps.get_model(tgt, self.model_name)
        if self.allow_migrate_model(schema_editor.connection.alias, from_model):
            schema_editor.remove_field(from_model, from_model._meta.get_field(self.name))
