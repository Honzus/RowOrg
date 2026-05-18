# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

RowOrg is a rowing team practice-scheduling app. Coaches create training sessions; rowers submit weekly availability; the backend's suggestion engine proposes ranked crew lineups (boat × seat assignments) based on availability, rowing capabilities (sculling/sweeping, port/starboard, cox-capable), and coach preferences. Coaches confirm or cancel proposed crews.

Two-package layout, one repo:
- `backend/` — Django 6 + Django REST Framework, JWT auth (SimpleJWT), PostgreSQL in prod via `DATABASE_URL`, SQLite locally.
- `frontend/` — React 19 + TypeScript + Vite, react-router v7, axios, react-dnd for crew building.

## Common commands

Backend (run from `backend/`, with the repo's `venv/` activated — `source ../venv/bin/activate`):
```bash
python manage.py migrate                       # apply migrations
python manage.py runserver                     # dev server on :8000
python manage.py makemigrations <app>          # after editing models
python manage.py seed_demo                     # populate a Demo Rowing Club + users (password: row123456)
python manage.py test                          # run all tests
python manage.py test suggestions.tests        # run one app's tests
python manage.py test suggestions.tests.SuggestionsTestCase.test_x   # single test
```

Frontend (run from `frontend/`, Node 20 per `.nvmrc`):
```bash
npm install
npm run dev        # Vite dev server on :5173, talks to http://localhost:8000/api
npm run build      # tsc -b && vite build
npm run lint       # eslint
```

Production runtime: `web: gunicorn roworg.wsgi --bind 0.0.0.0:$PORT` (see `backend/Procfile`), Python 3.12 (`runtime.txt`), whitenoise for static files.

## Architecture

### Backend — Django apps under `backend/`

The project is split into narrow apps mounted under `/api/`:

| App | URL prefix | Role |
|---|---|---|
| `users` | `/api/auth/` | Custom `AUTH_USER_MODEL` (`users.User`); register, JWT login/refresh, `/me/`. Email is `USERNAME_FIELD`. |
| `teams` | `/api/teams/` | `Team` (UUID PK, 8-char `invite_code` auto-generated). Create / join-by-code. |
| `availability` | `/api/availability/` | Per-user weekly time slots (`week_start`, `day_of_week`, `start_time`, `end_time`). |
| `training_sessions` | `/api/sessions/` | `Session` → `CrewAssignment` (boat) → `CrewSeat` (rower + seat #). Confirm/cancel are PATCH endpoints on the crew. |
| `suggestions` | `/api/suggestions/<session_id>/` | Returns ranked crew suggestions for a session (read-only; computed on demand). |
| `preferences` | `/api/preferences/` | Coach-side `CoachPreference` (rower → preferred boat/seat) and `PreferredPairing` (M2M of rowers that should row together). |

`roworg/settings.py` notes:
- `DEFAULT_AUTHENTICATION_CLASSES` = `JWTAuthentication`; `DEFAULT_PERMISSION_CLASSES` = `IsAuthenticated` — every endpoint requires JWT.
- Access token lifetime 1h, refresh 7d.
- `CORS_ALLOWED_ORIGINS` defaults to `http://localhost:5173`; override per env. `DATABASE_URL` env var switches to Postgres.

### The suggestion engine (`backend/suggestions/engine.py`)

The core domain logic lives here, not in views. `generate_suggestions(session)`:
1. Finds team members whose availability fully covers the session's day/time window.
2. Excludes rowers already in non-cancelled crews for that session (cancellation frees a rower; confirmation keeps them locked).
3. For each `BOAT_TYPES` entry (1x, 2x, 2-, 4x, 4-, 4+, 8+), generates combinations of eligible rowers (sculling-only or sweeping-only), validates port/starboard balance for sweep boats via `_validate_sides`, and scores each via `_score_combination` (coach preferences for boat type + matching `PreferredPairing` groups + a small bonus for committed side rowers).
4. Returns `{ 'suggestions': [...], 'available_coxswains': [...] }`. Suggestions are rower-only; the coach picks a cox separately on the frontend.

When adding boat types or scoring rules, this is the file to edit — views just call into it.

### Frontend — `frontend/src/`

- `api/client.ts` — single axios instance. Bearer-token injector + 401 refresh interceptor that retries the original request once, then logs out and redirects to `/login` on refresh failure.
- `App.tsx` — only three routes (`/login`, `/register`, `/dashboard`); everything else is gated through `Dashboard`.
- `pages/Dashboard.tsx` is a **role-router**, not just a page. It calls `/me/`, then:
  1. No team → `<TeamSetup>` (create or join by invite code).
  2. No role → `<ProfileSetup>` (pick coach / oarsman / coxswain, rowing capabilities).
  3. Otherwise → `<CoachDashboard>` or `<RowerDashboard>`.

  New onboarding steps should be inserted into this guard ladder.
- `components/` — `AvailabilityCalendar` (weekly time-slot grid), `CrewBuilder` (drag-and-drop seat assignment, react-dnd), `SessionView`.
- `types/index.ts` — single source of TS types mirroring the Django serializers.

### Cross-cutting conventions

- **Team scoping is enforced in querysets**, not by a permission class. View `get_queryset` methods filter by `self.request.user.team`. When adding endpoints, follow the same pattern — do not trust client-supplied team IDs.
- **Coach vs. rower authorization is checked in views per endpoint** (no global role-permission decorator). Read existing views before adding write endpoints that should be coach-only.
- The frontend stores `access_token` / `refresh_token` in `localStorage`; do not switch storage without updating the refresh interceptor.
- Boat-type strings (`'1x'`, `'4+'`, etc.) are the contract between the engine, the `CrewAssignment.boat_type` field, and `CoachPreference.preferred_boat_type`. Keep them consistent.
