#!/usr/bin/env python
"""Reset database script - creates tables directly from models without migrations."""

import os
import sys
import shutil
from pathlib import Path

# Setup Django before importing models
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

import django
from django.apps import apps
from django.contrib.auth import get_user_model
from django.db import connection
from django.core.management import call_command

# Initialize Django
django.setup()

# Get BASE_DIR from settings
from django.conf import settings
BASE_DIR = Path(settings.BASE_DIR)


def clean_migrations():
    """Delete all migration files."""
    print("Cleaning migration files...")
    for root, dirs, files in os.walk(BASE_DIR):
        if 'migrations' in dirs:
            migrations_dir = os.path.join(root, 'migrations')
            for filename in os.listdir(migrations_dir):
                if filename != '__init__.py' and (filename.endswith('.py') or filename.endswith('.pyc')):
                    file_path = os.path.join(migrations_dir, filename)
                    try:
                        os.remove(file_path)
                        print(f"  Deleted: {file_path}")
                    except Exception as e:
                        print(f"  Error deleting {file_path}: {e}")
            
            # Also remove __pycache__ if it exists
            pycache_dir = os.path.join(migrations_dir, '__pycache__')
            if os.path.exists(pycache_dir):
                shutil.rmtree(pycache_dir)
                print(f"  Removed: {pycache_dir}")
    
    # Ensure __init__.py exists in all migrations directories
    for root, dirs, files in os.walk(BASE_DIR):
        if 'migrations' in dirs:
            migrations_dir = os.path.join(root, 'migrations')
            init_file = os.path.join(migrations_dir, '__init__.py')
            if not os.path.exists(init_file):
                with open(init_file, 'w') as f:
                    f.write('')
                print(f"  Created: {init_file}")
    
    print("✓ Migration files cleaned")


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
    """Create all database tables from Django models."""
    print("Creating database tables...")
    
    try:
        # First, run migrate to create Django's built-in app tables and mark migrations as applied
        # This handles admin, auth, contenttypes, sessions, silk
        print("  Creating Django built-in app tables...")
        call_command('migrate', verbosity=1)
        
        # Then create tables for our custom apps using schema_editor
        print("  Creating custom app tables...")
        with connection.schema_editor() as schema_editor:
            for app_config in apps.get_app_configs():
                app_name = app_config.name
                # Skip Django's built-in apps - already handled by migrate
                if app_name.startswith('django.contrib.') or app_name == 'silk':
                    continue
                
                for model in app_config.get_models():
                    table_name = model._meta.db_table
                    try:
                        schema_editor.create_model(model)
                        print(f"  ✓ Created table: {table_name} ({app_name})")
                    except Exception as e:
                        # Table might already exist
                        if "already exists" not in str(e).lower():
                            print(f"  ⚠ Warning creating table {table_name}: {e}")
        
        print("✓ Database tables created")
    except Exception as e:
        print(f"✗ Critical error creating tables: {e}")
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


def main():
    print("="*60)
    print("DATABASE RESET SCRIPT (NO MIGRATIONS)")
    print("="*60)
    
    clean_migrations()
    drop_database()
    create_tables()
    create_superuser()
    
    print("\n" + "="*60)
    print("RESET COMPLETE")
    print("="*60)


if __name__ == '__main__':
    main()
