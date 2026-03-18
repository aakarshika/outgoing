#!/bin/bash
set -e
# Vercel build script
echo "Installing dependencies..."
pip install .

echo "Running database migrations..."
if [ -n "$DIRECT_URL" ]; then
    echo "Using DIRECT_URL for migrations..."
    DATABASE_URL=$DIRECT_URL DJANGO_SETTINGS_MODULE=config.settings.production python manage.py migrate --noinput
else
    DJANGO_SETTINGS_MODULE=config.settings.production python manage.py migrate --noinput
fi

echo "Generating simple seed data..."
DJANGO_SETTINGS_MODULE=config.settings.production python manage.py generate_seed_simple

echo "Seeding simple data..."
DJANGO_SETTINGS_MODULE=config.settings.production python manage.py seed_simple

echo "Collecting static files..."
DJANGO_SETTINGS_MODULE=config.settings.production python manage.py collectstatic --noinput --clear

echo "Build complete."
