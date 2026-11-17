import os
from pathlib import Path
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from root repository .env
load_dotenv(BASE_DIR.parent / '.env')

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'thepotlite-django-secret-key-v1-pilot-2026-secure')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DJANGO_DEBUG', 'True') == 'True'

ALLOWED_HOSTS = ['*']
RENDER_EXTERNAL_HOSTNAME = os.getenv('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'whitenoise.runserver_nostatic',
    'django.contrib.staticfiles',

    # Third-party packages
    'corsheaders',
    'rest_framework',
    'drf_spectacular',

    # ThePotLite Core Domain Apps
    'accounts',
    'organizations',
    'pots',
    'assistance',
    'governance',
    'audit',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Must be at the very top
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # WhiteNoise for static files on Render
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'thepot.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
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

WSGI_APPLICATION = 'thepot.wsgi.application'

# Database Configuration (PostgreSQL with SQLite fallback)
def configure_database():
    sqlite_config = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }

    raw_url = os.getenv('DATABASE_URL', '').strip()
    if not raw_url:
        print("[Django DB] No DATABASE_URL provided. Using SQLite database.")
        return sqlite_config

    # If running in cloud (Render) and DATABASE_URL points to localhost, ignore it
    is_render = bool(os.getenv('RENDER') or os.getenv('RENDER_SERVICE_ID'))
    if is_render and ('localhost' in raw_url or '127.0.0.1' in raw_url):
        print("[Django DB] Cloud environment detected with localhost DATABASE_URL. Falling back to SQLite.")
        return sqlite_config

    if 'postgres' in raw_url:
        try:
            import dj_database_url
            import psycopg2
            parsed = dj_database_url.parse(raw_url)
            # Verify connectivity before locking Django into PostgreSQL
            conn = psycopg2.connect(
                dbname=parsed.get('NAME') or 'thepot',
                user=parsed.get('USER') or 'postgres',
                password=parsed.get('PASSWORD') or '',
                host=parsed.get('HOST') or 'localhost',
                port=parsed.get('PORT') or 5432,
                connect_timeout=2
            )
            conn.close()
            print("[Django DB] Connected to PostgreSQL successfully.")
            parsed['CONN_MAX_AGE'] = 600
            return parsed
        except Exception as e:
            print(f"[Django DB] PostgreSQL connection failed ({e}). Falling back to SQLite database.")
            return sqlite_config

    try:
        import dj_database_url
        return dj_database_url.parse(raw_url, conn_max_age=600)
    except Exception as e:
        print(f"[Django DB] Error parsing DATABASE_URL: {e}. Using SQLite.")
        return sqlite_config

DATABASES = {
    'default': configure_database()
}


# Custom User Model
AUTH_USER_MODEL = 'accounts.User'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 6}},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Django REST Framework Settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# Swagger / OpenAPI Documentation Settings
SPECTACULAR_SETTINGS = {
    'TITLE': 'ThePotLite V1 Pilot API',
    'DESCRIPTION': 'Non-custodial obligation tracking, dual-confirmation payment reconciliation, and governance API for youth sports.',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'persistAuthorization': True,
        'displayOperationId': False,
        'defaultModelsExpandDepth': 1,
        'defaultModelExpandDepth': 1,
    },
}

# CORS Configuration for TypeScript Frontend
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Twilio Configuration
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', '')
TWILIO_API_KEY_SID = os.getenv('TWILIO_API_KEY_SID', '')
TWILIO_API_KEY_SECRET = os.getenv('TWILIO_API_KEY_SECRET', '')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER', '')
