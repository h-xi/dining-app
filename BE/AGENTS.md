# AGENTS.md

Backend for the dining app: a **Restaurant Yield Management Platform** — a two-sided marketplace
monetizing perishable sit-down dining inventory. Diners prepay a discounted fee (e.g. $30 for a
$50 dining credit) to reserve specific tables during off-peak windows or last-minute opening gaps,
giving restaurants incremental cash flow on tables that would otherwise sit empty.

Django + Django REST Framework.

## Stack

- Python 3.9, Django 4.2, Django REST Framework
- Auth: `djangorestframework-simplejwt` (JWT, with token blacklist app enabled for logout/revocation)
- `django-cors-headers` for CORS
- `django-filter` as the default DRF filter backend
- `django-environ` for `.env`-based settings
- Postgres 16 (via Docker Compose) as the database
- Celery + Redis (via Docker Compose) for background/periodic tasks

## Project layout

- `config/` — Django project package: `settings.py`, `urls.py`, `wsgi.py`, `asgi.py`, `celery.py` (Celery app)
- `core/` — first app: domain models, admin, and background tasks for the marketplace
- `docker-compose.yml` — local `db` (Postgres, 5432) and `redis` (6379) services
- `.env` / `.env.example` — environment config (`SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`,
  `DATABASE_URL`, `CORS_ALLOWED_ORIGINS`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`)
- `.venv/` — virtualenv, not committed
- `requirements.txt` — frozen dependencies

## Domain models (`core/models.py`)

- **Restaurant** — owner (User FK), name, address, timezone, contact info, `is_active`
- **Table** — belongs to a restaurant; `table_number`, `capacity`, `location_description`, `is_active`
- **AvailabilitySlot** — belongs to a table; `start_time`/`end_time`, `credit_value` (face value,
  e.g. $50) vs `prepay_price` (discounted price, e.g. $30), and a `status` state machine:
  `open → reserved → fulfilled`, or `expired`/`cancelled`
- **Reservation** — one-to-one with a slot; diner (User FK), `party_size`, `confirmation_code`
  (UUID), `status` (`pending_payment → confirmed → completed`, or `cancelled`/`no_show`),
  `amount_paid`, `stripe_payment_intent_id` (placeholder — payment integration not built yet)

All registered in Django admin (`core/admin.py`).

## Background tasks (`core/tasks.py`)

- `expire_availability_slots` — bulk-transitions any `AvailabilitySlot` still `open` whose
  `start_time` has passed to `expired`. Scheduled via `CELERY_BEAT_SCHEDULE` in `config/settings.py`
  to run every 60 seconds. Requires both a Celery worker and Celery beat running (see below).

## Running locally

```
docker compose up -d
source .venv/bin/activate
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# in separate terminals, for background/periodic tasks:
celery -A config worker -l info
celery -A config beat -l info
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

Domain models (Restaurant, Table, AvailabilitySlot, Reservation) and slot-expiry Celery task are
in place and migrated. No serializers or API views built yet beyond JWT auth routes — payment
integration (Stripe) is also not yet wired up.
