import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent


def _split_csv_env(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "django-insecure-dev-key")
DEBUG = os.getenv("DEBUG", "True").lower() == "true"

allowed_hosts = _split_csv_env(
    os.getenv("ALLOWED_HOSTS", "127.0.0.1,localhost,testserver,.onrender.com")
)
render_external_hostname = os.getenv("RENDER_EXTERNAL_HOSTNAME", "").strip()
if render_external_hostname and render_external_hostname not in allowed_hosts:
    allowed_hosts.append(render_external_hostname)
ALLOWED_HOSTS = allowed_hosts

csrf_trusted_origins = _split_csv_env(os.getenv("CSRF_TRUSTED_ORIGINS", ""))
if render_external_hostname:
    render_origin = f"https://{render_external_hostname}"
    if render_origin not in csrf_trusted_origins:
        csrf_trusted_origins.append(render_origin)
CSRF_TRUSTED_ORIGINS = csrf_trusted_origins

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "detector",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "roadsight.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.template.context_processors.csrf",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "roadsight.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "staticfiles": {
        "BACKEND": (
            "django.contrib.staticfiles.storage.StaticFilesStorage"
            if DEBUG
            else "whitenoise.storage.CompressedManifestStaticFilesStorage"
        ),
    }
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG

YOLO_MODEL_PATH = os.getenv("YOLO_MODEL_PATH", str(BASE_DIR / "yolov8n.pt"))
YOLO_MODEL_PATH_EXPLICIT = "YOLO_MODEL_PATH" in os.environ
YOLO_FALLBACK_MODEL_PATHS = (
    str(BASE_DIR / "runs" / "detect" / "pothole_model" / "weights" / "best.pt"),
    str(BASE_DIR / "runs" / "detect" / "train" / "weights" / "best.pt"),
)
YOLO_TARGET_LABELS = tuple(
    label.strip().lower()
    for label in os.getenv("YOLO_TARGET_LABELS", "pothole,potholes").split(",")
    if label.strip()
)
VIDEO_FRAME_STRIDE = int(os.getenv("VIDEO_FRAME_STRIDE", "5"))
POTHOLE_CAMERA_FOCAL_LENGTH_PX = float(os.getenv("POTHOLE_CAMERA_FOCAL_LENGTH_PX", "1100"))
POTHOLE_REFERENCE_WIDTH_M = float(os.getenv("POTHOLE_REFERENCE_WIDTH_M", "0.75"))
POTHOLE_DISTANCE_MIN_M = float(os.getenv("POTHOLE_DISTANCE_MIN_M", "1.5"))
POTHOLE_DISTANCE_MAX_M = float(os.getenv("POTHOLE_DISTANCE_MAX_M", "25.0"))
