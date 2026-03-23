"""Solo-dev shortcut: full schema reset then optional seed."""

from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = (
        "Reset the database schema (reset_db_schema --yes), then run seed_simple. "
        "Use --no-seed to only reset."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--no-seed",
            action="store_true",
            help="Only run reset_db_schema; skip seed_simple.",
        )

    def handle(self, *args, **options):
        call_command("reset_db_schema", yes=True)
        if options["no_seed"]:
            self.stdout.write(self.style.SUCCESS("Schema reset complete (no seed)."))
            return
        call_command("seed_simple")
        self.stdout.write(self.style.SUCCESS("Schema reset and seed complete."))
