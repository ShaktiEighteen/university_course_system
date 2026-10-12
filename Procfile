web: gunicorn course_system.wsgi:application --log-file -
release: python manage.py migrate && python manage.py seed_db && python manage.py apply_views
