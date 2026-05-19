#!/usr/bin/env bash
# Render build hook. Runs from backend/ as rootDir.
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate
