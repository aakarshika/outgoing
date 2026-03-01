#!/usr/bin/env python
"""Reset database script using Django migrations."""

import os
import sys
from pathlib import Path

# Setup Django before importing models
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

import django
from django.contrib.auth import get_user_model
from django.core.management import call_command

# Initialize Django
django.setup()

# Get BASE_DIR from settings
from django.conf import settings
BASE_DIR = Path(settings.BASE_DIR)


def drop_database():
    """Drop the SQLite database file."""
    db_path = BASE_DIR / 'db.sqlite3'
    if db_path.exists():
        print(f"Dropping database {db_path}...")
        try:
            os.remove(db_path)
            print("✓ Database dropped")
        except Exception as e:
            print(f"Error dropping database: {e}")
            sys.exit(1)
    else:
        print("Database does not exist. Skipping drop.")


def create_tables():
    """Create all database tables from migrations."""
    print("Running migrations...")
    try:
        call_command('migrate', verbosity=1)
        print("✓ Database tables created from migrations")
    except Exception as e:
        print(f"✗ Critical error running migrations: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


def create_superuser():
    """Create default superuser."""
    print("\nCreating superuser...")
    try:
        User = get_user_model()
        if not User.objects.filter(username='root').exists():
            User.objects.create_superuser('root', 'root@root.com', 'root')
            print("✓ Superuser 'root' created")
        else:
            print("✓ Superuser 'root' already exists")
    except Exception as e:
        print(f"✗ Error creating superuser: {e}")
        import traceback
        traceback.print_exc()


def seed_categories():
    """Seed the EventCategory table with initial data."""
    print("\nSeeding event categories...")
    try:
        from apps.events.models import EventCategory
        categories = [
            ("Music", "music", "music"),
            ("Food & Drink", "food-drink", "utensils"),
            ("Nightlife", "nightlife", "moon"),
            ("Sports & Fitness", "sports-fitness", "dumbbell"),
            ("Arts & Culture", "arts-culture", "palette"),
            ("Tech & Innovation", "tech-innovation", "cpu"),
            ("Workshops & Classes", "workshops-classes", "book-open"),
            ("Outdoors & Adventure", "outdoors-adventure", "mountain"),
            ("Comedy", "comedy", "laugh"),
            ("Networking & Social", "networking-social", "users"),
            ("Festivals", "festivals", "party-popper"),
            ("Community", "community", "heart-handshake"),
        ]
        
        count = 0
        for name, slug, icon in categories:
            _, created = EventCategory.objects.get_or_create(
                slug=slug,
                defaults={"name": name, "icon": icon}
            )
            if created:
                count += 1
                
        print(f"✓ Seeded {count} event categories")
    except Exception as e:
        print(f"✗ Error seeding categories: {e}")
        import traceback
        traceback.print_exc()


def main():
    print("="*60)
    print("DATABASE RESET SCRIPT (MIGRATIONS)")
    print("="*60)
    
    drop_database()
    create_tables()
    create_superuser()
    seed_categories()
    
    print("\n" + "="*60)
    print("RESET COMPLETE")
    print("="*60)


if __name__ == '__main__':
    main()
