# AGENTS.md

Backend for the dining app: a **Restaurant Yield Management Platform** — a two-sided marketplace
monetizing perishable sit-down dining inventory. Diners prepay a discounted fee (e.g. $30 for a
$50 dining credit) to reserve specific tables during off-peak windows or last-minute opening gaps,
giving restaurants incremental cash flow on tables that would otherwise sit empty.

Django + Django REST Framework.

## Stack

- Python 3.9, Django 4.2, Django REST Framework
- Auth: Google Sign-In only — no passwords are ever stored (see below). `djangorestframework-simplejwt`
  still issues our own access/refresh tokens after Google verification (token blacklist app enabled
  for logout/revocation).
- `google-auth` + `requests` to verify Google ID tokens server-side
- `django-cors-headers` for CORS
- `django-filter` as the default DRF filter backend
- `django-environ` for `.env`-based settings
- Postgres 16 (via Docker Compose) as the database
- Celery + Redis (via Docker Compose) for background/periodic tasks
- `pytest` + `pytest-django` for testing (plain pytest fixtures, not factory libraries — see below)

## Project layout

- `config/` — Django project package: `settings.py`, `urls.py`, `wsgi.py`, `asgi.py`, `celery.py` (Celery app)
- `accounts/` — custom `User` model + Google Sign-In endpoint
- `core/` — marketplace domain app: models, admin, and background tasks
- `docker-compose.yml` — local `db` (Postgres, 5432) and `redis` (6379) services
- `.env` / `.env.example` — environment config (`SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`,
  `DATABASE_URL`, `CORS_ALLOWED_ORIGINS`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`,
  `GOOGLE_OAUTH_CLIENT_ID`)
- `.venv/` — virtualenv, not committed
- `requirements.txt` — frozen dependencies

## Auth (`accounts/`)

- `accounts.User` (`AUTH_USER_MODEL`) extends `AbstractUser`, adding `google_sub` (Google's stable
  `sub` claim, unique) and `avatar_url`. Passwords are never set — new users get
  `set_unusable_password()` on creation.
- `POST /api/auth/google/` (`accounts/views.py::GoogleLoginView`) — frontend authenticates with
  Google directly (Google Sign-In SDK) and POSTs the resulting `id_token` here. We verify it
  against Google's public keys via `google.oauth2.id_token.verify_oauth2_token`
  (audience = `settings.GOOGLE_OAUTH_CLIENT_ID`), get-or-create the local `User` by `google_sub`,
  and return our own `access`/`refresh` JWT pair (via simplejwt) plus basic profile info. All
  other endpoints authenticate against *our* JWTs, not Google's, so nothing downstream needs to
  know Google is involved.
- `GOOGLE_OAUTH_CLIENT_ID` is currently a placeholder in `.env` — replace with the real OAuth 2.0
  Web Client ID from Google Cloud Console (APIs & Services → Credentials) once the project exists.
- `POST /api/auth/token/refresh/` / `POST /api/auth/token/blacklist/` — still handled by
  simplejwt's stock views, for refreshing/revoking the tokens we issue.

## Domain models (`core/models.py`)

- **Restaurant** — owner (User FK), name, address, timezone, contact info, `is_active`
- **Table** — belongs to a restaurant; `table_number`, `capacity`, `location_description`, `is_active`
- **AvailabilitySlot** — belongs to a table; `start_time`/`end_time`, `credit_value` (face value,
  e.g. $50) vs `prepay_price` (discounted price, e.g. $30), and a `status` state machine:
  `open → reserved → fulfilled`, or `expired`/`cancelled`
- **Reservation** — one-to-one with a slot; diner (User FK), `party_size`, `confirmation_code`
  (UUID), `status` (`pending_payment → confirmed → completed`, or `cancelled`/`no_show`),
  `amount_paid`, `stripe_payment_intent_id` (placeholder — payment integration not built yet)

All registered in Django admin (`core/admin.py`, `accounts/admin.py`).

## Background tasks (`core/tasks.py`)

- `expire_availability_slots` — bulk-transitions any `AvailabilitySlot` still `open` whose
  `start_time` has passed to `expired`. Scheduled via `CELERY_BEAT_SCHEDULE` in `config/settings.py`
  to run every 60 seconds. Requires both a Celery worker and Celery beat running (see below).

## Testing

- `pytest.ini` points tests at `config.settings_test` (inherits `config/settings.py`, but runs
  Celery tasks eagerly and uses the fast MD5 password hasher).
- `core/tests/conftest.py` holds shared fixtures (`diner`, `owner`, `restaurant`, `table`, `slot`,
  `reservation`), built with plain `Model.objects.create(...)` calls and composed via fixture
  dependencies — no `factory_boy`/`Faker`, by preference.
- `accounts/tests/test_views.py` mocks `google_id_token.verify_oauth2_token` to exercise the
  Google login flow (new user creation, repeat-login reuse, invalid token → 401) without calling
  out to Google.
- Run with `pytest` (from the venv). `--reuse-db` is on by default; pass `--create-db` to force a
  fresh test database after a migration change.

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

## DRF defaults (`config/settings.py`)

- `DEFAULT_AUTHENTICATION_CLASSES`: JWT only
- `DEFAULT_PERMISSION_CLASSES`: `IsAuthenticated` (endpoints are locked down by default; opt out explicitly per-view where public access is needed)
- `DEFAULT_FILTER_BACKENDS`: `django_filters.rest_framework.DjangoFilterBackend`
- Pagination: `PageNumberPagination`, page size 20

## Status

Domain models (Restaurant, Table, AvailabilitySlot, Reservation), slot-expiry Celery task, and
Google Sign-In (custom User model, `/api/auth/google/`) are in place, migrated, and tested. No
serializers/views for the domain models yet — payment integration (Stripe) also not yet wired up.
A real `GOOGLE_OAUTH_CLIENT_ID` still needs to be created in Google Cloud Console and dropped
into `.env`.
