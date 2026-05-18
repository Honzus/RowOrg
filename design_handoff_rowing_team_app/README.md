# Handoff: RowOrg — Complete Frontend Redesign

This package contains a high-fidelity HTML prototype redesign of **RowOrg** (https://github.com/Honzus/RowOrg), plus everything Claude Code needs to translate it into the existing React + TypeScript + Vite frontend and the Django REST backend.

---

## About the design files

The HTML/JSX files in `prototype/` are **design references**, not production code to copy verbatim. They are plain-JS React components inlined into a single HTML file for prototyping purposes. The task is to **recreate these designs in the existing RowOrg codebase** using its established patterns:

- Frontend: React 19 + TypeScript + Vite + react-router-dom + react-dnd (already a dependency in `frontend/package.json`)
- Backend: Django + DRF (apps: `users`, `teams`, `availability`, `training_sessions`, `preferences`, `suggestions`)
- Styling: Currently a single `frontend/src/App.css` with hand-rolled CSS classes; the redesign introduces a token system that should replace the existing styles wholesale.

## Fidelity

**High-fidelity (hifi).** Every screen specifies exact hex values, typography (Geist + Geist Mono), spacing, layout grids, and interaction states. Recreate pixel-perfectly inside the React + TS structure.

The prototype includes a `tweaks-panel.jsx` for design-time experimentation (palette toggle, density, builder variant) — **do NOT port the Tweaks panel into production.** It exists only so the designer/PM could compare variants. The production app picks a single value for each (specified below in `DESIGN_TOKENS.md`).

---

## What's new vs. existing app

The existing app (per `frontend/src/`) covers: Login/Register/Profile setup, Team setup, a coach Dashboard listing sessions + a basic SessionView with a manual CrewBuilder and Suggestions, and a rower Dashboard with availability + lineups. The redesign **keeps every existing feature** and adds:

| New | Notes |
|---|---|
| **App shell** with persistent sidebar nav, top bar, role switcher (Coach ↔ Rower), and mobile bottom tabs | Replaces the bare `Dashboard.tsx` shell |
| **Visual design system** | New token system (`DESIGN_TOKENS.md`) — replaces `App.css` |
| **Lineup Templates** | New feature. Saved stroke-to-bow lineups (e.g. "Race VIII"). Surfaced in Preferences page + as a "Load template…" dropdown in the Crew Builder. Requires backend additions (see `BACKEND_CHANGES.md`). |
| **Coach Plan page** | New page. Team availability heatmap (color intensity = how many rowers free in each half-hour). Drag across cells to draft a session at a time when coverage is highest. Requires one new backend endpoint (`team availability aggregate`). |
| **Crew Builder — Hull view** | New visualization. Existing list view is preserved as "List" tab. Both share the same drag-and-drop logic. |
| **Availability calendar — drag-to-paint** | Replaces existing "click + Add slot form" flow. Drag any range on the grid to create a slot directly. |
| **Filterable / sortable Suggestions** | Filter chips by boat type, sort by score or boat type. |
| **Regattas page** | New, lightweight. Static list for now — no backend changes required (can be wired up later). |
| **Roster / Crews / Preferences as standalone pages** | Existing data, new dedicated screens. |

The existing **Equipment** page concept (briefly considered) was deliberately removed — defer to a future "Clubs" scope, not "Teams."

---

## File layout

```
design_handoff_rowing_team_app/
├── README.md                ← you are here
├── SCREENS.md               ← every screen specified in detail
├── FRONTEND_MAP.md          ← prototype file → target TS file mapping
├── BACKEND_CHANGES.md       ← new models, endpoints, migrations
├── DESIGN_TOKENS.md         ← colors, type, spacing, shadows
├── INTERACTIONS.md          ← drag/hover/state behavior specs
└── prototype/
    ├── Rowing Team App.html ← self-contained, open in a browser to inspect
    └── source/              ← split source files (CSS + .jsx components)
```

---

## Recommended implementation order

1. **Design tokens & global styles** (`DESIGN_TOKENS.md`) — replace `App.css` with token-based system. Set up Geist fonts.
2. **App shell** — sidebar, top bar, role switcher, mobile tabs, routing scaffolding. Replace `Dashboard.tsx` with a `<Shell>` layout component wrapping `<Outlet />`.
3. **Refactor existing pages into the shell** — CoachDashboard, RowerDashboard, SessionView, AvailabilityCalendar, CrewBuilder. Apply new styling; preserve API calls. Add the drag-to-paint behavior to AvailabilityCalendar.
4. **Crew Builder visual upgrade** — add Hull variant, persistent header tabs, "Load template…" dropdown.
5. **New standalone pages** — Roster, Crews, Preferences (with Lineup Templates section), Regattas.
6. **Backend: Lineup Templates** — model + endpoints + serializer + admin. See `BACKEND_CHANGES.md`.
7. **Backend: Team availability aggregate** — single new endpoint that returns the heatmap data. See `BACKEND_CHANGES.md`.
8. **Coach Plan page** — wire to new aggregate endpoint + existing session-create endpoint.

Each step ships independently. Order is suggested, not strict.

---

## Conventions to preserve

- **Existing API client pattern** — `src/api/client.ts` plus per-resource modules (`auth.ts`, `availability.ts`, `sessions.ts`, `teams.ts`). Add `templates.ts` and `planning.ts` here.
- **Existing type shapes** — `src/types/index.ts`. Extend with `LineupTemplate`, `TeamAvailabilityBlock` (see `BACKEND_CHANGES.md` for full shapes).
- **react-router-dom** is already wired (`BrowserRouter` in `App.tsx`). Add nested routes under a layout component.
- **react-dnd + HTML5Backend** is already used by `CrewBuilder.tsx` — reuse it for the new Hull variant and keep the same `<DndProvider>` wrap.
- **Auth + role gating** — the existing `getMe()` returns a user with `role: 'coach' | 'oarsman' | 'coxswain'`. The "Role switcher" in the prototype is a designer-time toggle; in production it should be gated by `user.role` — coaches see coach nav, rowers see rower nav. Coxswains use the rower views.

---

## Open questions for the team

1. **Lineup template ownership** — per-coach or per-team? (Recommend: per-team, owned by a coach. Other coaches in the same team can see + edit.)
2. **Heatmap performance** — for large teams, aggregating availability in the API per request is fine; for 50+ rowers consider caching or precomputing.
3. **Drag-to-create session** — should it pre-populate a default workout from the most recent session, or stay blank? (Prototype: blank.)
4. **Cox preference for templates** — current model is "preferred but swappable." If the preferred cox is unavailable, suggestions engine should propose the next-best cox automatically.

---

See `SCREENS.md` for the full screen-by-screen spec.
