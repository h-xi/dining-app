# AGENTS.md

Backend for the dining app. Django + Django REST Framework.

## Stack

- Python 3.9, Django 4.2, Django REST Framework
- Auth: `djangorestframework-simplejwt` (JWT, with token blacklist app enabled for logout/revocation)
- `django-cors-headers` for CORS
- `django-filter` as the default DRF filter backend
- `django-environ` for `.env`-based settings
- Postgres 16 (via Docker Compose) as the database

## Project layout

- `config/` — Django project package: `settings.py`, `urls.py`, `wsgi.py`, `asgi.py`
- `core/` — first app (currently just scaffolding: `models.py`, `views.py`, `urls.py` empty)
- `docker-compose.yml` — local Postgres service (`db`, port 5432, db `dining_app`, user/pass `postgres`)
- `.env` / `.env.example` — environment config (`SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `DATABASE_URL`, `CORS_ALLOWED_ORIGINS`)
- `.venv/` — virtualenv, not committed
- `requirements.txt` — frozen dependencies

## Running locally

```
docker compose up -d
source .venv/bin/activate
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Auth endpoints (already wired in `config/urls.py`)

- `POST /api/auth/token/` — obtain access + refresh token
- `POST /api/auth/token/refresh/` — refresh access token
- `POST /api/auth/token/blacklist/` — revoke a refresh token

App-specific routes live in `core/urls.py`, included under `/api/`.

## DRF defaults (`config/settings.py`)

- `DEFAULT_AUTHENTICATION_CLASSES`: JWT only
- `DEFAULT_PERMISSION_CLASSES`: `IsAuthenticated` (endpoints are locked down by default; opt out explicitly per-view where public access is needed)
- `DEFAULT_FILTER_BACKENDS`: `django_filters.rest_framework.DjangoFilterBackend`
- Pagination: `PageNumberPagination`, page size 20

## Status

Project scaffolding complete. No models, serializers, or views built yet beyond the `core` app skeleton and JWT auth routes.
