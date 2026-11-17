#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install Python requirements
pip install -r backend/requirements.txt

# Run migrations and collect static files
python backend/manage.py collectstatic --no-input
python backend/manage.py migrate

# Seed initial organization, test pot, coach and member accounts
python backend/seed.py
