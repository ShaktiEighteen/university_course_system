# Multi-stage Dockerfile for Production Django Web Service
FROM python:3.11-slim

# Prevent Python from writing .pyc and enable buffer-less stdout
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy project code
COPY . /app/

# Collect static files with WhiteNoise
RUN python manage.py collectstatic --noinput

# Run migrations, seed database, and start Gunicorn server
EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate && python manage.py seed_db && python manage.py apply_views && gunicorn course_system.wsgi:application --bind 0.0.0.0:8000 --workers 3"]
