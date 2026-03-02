#!/bin/bash
# Vercel build script
echo "Installing dependencies..."
pip install -r requirements.txt

echo "Running database migrations..."
DJANGO_SETTINGS_MODULE=config.settings.production python manage.py migrate --noinput

echo "Collecting static files..."
DJANGO_SETTINGS_MODULE=config.settings.production python manage.py collectstatic --noinput --clear

echo "Build complete."
