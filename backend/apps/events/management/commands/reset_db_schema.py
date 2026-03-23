"""
Drop every table in the default database, then run `migrate` to recreate an empty schema.

Use before `seed_simple` when you want a full structural reset (not just ORM deletes).

  python manage.py reset_db_schema --yes
  python manage.py seed_simple

Also creates a local-dev Django admin superuser (username/password: root / root).

This does not transform or preserve data. Unsupported engines raise CommandError.
"""

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, connections


class Command(BaseCommand):
    help = (
        "Drops all tables in the default DB and reapplies migrations (empty schema). "
        "Run before seed_simple. Requires --yes."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--yes",
            action="store_true",
            help="Confirm destructive reset of the entire schema.",
        )

    def handle(self, *args, **options):
        if not options["yes"]:
            raise CommandError(
                "Refusing to reset the database. Pass --yes to drop all tables and re-run migrations."
            )

        connections.close_all()

        vendor = connection.vendor
        self.stdout.write(self.style.WARNING(f"Resetting schema (engine={vendor})..."))

        if vendor == "sqlite":
            self._drop_all_sqlite()
        elif vendor == "postgresql":
            self._drop_all_postgresql()
        elif vendor == "mysql":
            self._drop_all_mysql()
        else:
            raise CommandError(
                f"Unsupported database vendor {vendor!r}. "
                "Add a branch in reset_db_schema.py or use migrate/sql manually."
            )

        self.stdout.write("Running migrate...")
        call_command("migrate", interactive=False, verbosity=1)
        self._ensure_dev_superuser()
        self.stdout.write(
            self.style.SUCCESS(
                "Empty schema ready (admin: root / root). Next: python manage.py seed_simple"
            )
        )

    def _ensure_dev_superuser(self):
        User = get_user_model()
        username = "root"
        password = "root"
        email = "root@localhost"
        user = User.objects.filter(username=username).first()
        if user:
            user.email = email
            user.is_staff = True
            user.is_superuser = True
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Updated superuser {username!r}."))
        else:
            User.objects.create_superuser(
                username=username, email=email, password=password
            )
            self.stdout.write(self.style.SUCCESS(f"Created superuser {username!r}."))

    def _drop_all_sqlite(self):
        with connection.cursor() as cursor:
            # Views (e.g. event_overview from seed_simple) reference tables; drop them first or migrate breaks.
            cursor.execute("SELECT name FROM sqlite_master WHERE type='view'")
            views = [row[0] for row in cursor.fetchall()]
            for name in views:
                cursor.execute(f'DROP VIEW IF EXISTS "{name}"')

            cursor.execute("SELECT name FROM sqlite_master WHERE type='trigger'")
            triggers = [row[0] for row in cursor.fetchall()]
            for name in triggers:
                cursor.execute(f'DROP TRIGGER IF EXISTS "{name}"')

            # Exclude sqlite-internal tables (sqlite_sequence, …).
            cursor.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite%'"
            )
            tables = [row[0] for row in cursor.fetchall()]
            cursor.execute("PRAGMA foreign_keys = OFF")
            for name in tables:
                cursor.execute(f'DROP TABLE IF EXISTS "{name}"')
            cursor.execute("PRAGMA foreign_keys = ON")
        self.stdout.write(
            f"  Dropped {len(views)} view(s), {len(triggers)} trigger(s), {len(tables)} table(s) (SQLite)."
        )

    def _drop_all_postgresql(self):
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT tablename
                FROM pg_tables
                WHERE schemaname = 'public'
                """
            )
            tables = [row[0] for row in cursor.fetchall()]
            for name in tables:
                cursor.execute(f'DROP TABLE IF EXISTS "{name}" CASCADE')
        self.stdout.write(f"  Dropped {len(tables)} PostgreSQL table(s) in public.")

    def _drop_all_mysql(self):
        with connection.cursor() as cursor:
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
            cursor.execute("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'")
            tables = [row[0] for row in cursor.fetchall()]
            for name in tables:
                cursor.execute(f"DROP TABLE IF EXISTS `{name}`")
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
        self.stdout.write(f"  Dropped {len(tables)} MySQL table(s).")
