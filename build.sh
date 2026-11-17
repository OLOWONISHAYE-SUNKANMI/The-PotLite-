#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "🚀 Starting ThePotLite Django Build Process..."

# Detect if running from backend directory or repo root
if [ -f "requirements.txt" ]; then
    echo "📁 Detected execution inside backend/ directory"
    pip install --upgrade pip
    pip install -r requirements.txt
    python manage.py collectstatic --no-input
    python manage.py migrate
    python seed.py
elif [ -f "backend/requirements.txt" ]; then
    echo "📁 Detected execution inside repository root directory"
    pip install --upgrade pip
    pip install -r backend/requirements.txt
    python backend/manage.py collectstatic --no-input
    python backend/manage.py migrate
    python backend/seed.py
else
    echo "❌ Error: requirements.txt not found!"
    exit 1
fi

echo "✅ Build and seed completed successfully!"

