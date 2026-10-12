import os
from pathlib import Path
from dotenv import load_dotenv

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file
load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-university-course-mgmt-key-replace-in-prod')
DEBUG = os.getenv('DEBUG', 'True').lower() in ('true', '1', 'yes')
ALLOWED_HOSTS = ['*']

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Project Apps
    'apps.core',
    'apps.courses',
    'apps.registration',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'course_system.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'course_system.wsgi.application'

# ==============================================================
# DATABASE CONFIGURATION WITH SWITCH (PostgreSQL / MySQL / SQLite)
# ==============================================================
DB_ENGINE = os.getenv('DB_ENGINE', 'sqlite').lower()

if DB_ENGINE == 'postgresql':
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME', 'university_db'),
            'USER': os.getenv('DB_USER', 'postgres'),
            'PASSWORD': os.getenv('DB_PASSWORD', 'postgres'),
            'HOST': os.getenv('DB_HOST', 'localhost'),
            'PORT': os.getenv('DB_PORT', '5432'),
            'CONN_MAX_AGE': 600,  # Persistent connection pooling
            'OPTIONS': {
                'connect_timeout': 10,
            }
        }
    }
elif DB_ENGINE == 'mysql':
    try:
        import pymysql
        pymysql.install_as_MySQLdb()
    except ImportError:
        pass

    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': os.getenv('DB_NAME', 'university_db'),
            'USER': os.getenv('DB_USER', 'root'),
            'PASSWORD': os.getenv('DB_PASSWORD', 'root'),
            'HOST': os.getenv('DB_HOST', 'localhost'),
            'PORT': os.getenv('DB_PORT', '3306'),
            'CONN_MAX_AGE': 600,  # Connection pooling
            'OPTIONS': {
                'charset': 'utf8mb4',
                'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            }
        }
    }
else:
    # Default out-of-the-box fallback
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'university_db.sqlite3',
            'CONN_MAX_AGE': 600,
        }
    }

# Password validation and hashing
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 6}},
]

PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'

CSRF_TRUSTED_ORIGINS = [
    'https://*.loca.lt',
    'https://*.trycloudflare.com',
    'https://*.onrender.com',
    'https://*.vercel.app',
    'https://*.railway.app',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
]

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Academic Policy Defaults
MAX_CREDITS_PER_SEMESTER = int(os.getenv('MAX_CREDITS_PER_SEMESTER', '18'))
DEFAULT_SEMESTER = os.getenv('DEFAULT_SEMESTER', 'Fall')
DEFAULT_YEAR = int(os.getenv('DEFAULT_YEAR', '2026'))

# Session settings
SESSION_COOKIE_AGE = 86400  # 1 day
SESSION_SAVE_EVERY_REQUEST = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False  # Allows vanilla JS AJAX to read csrftoken cookie
