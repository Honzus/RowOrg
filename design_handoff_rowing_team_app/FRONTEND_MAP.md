# Frontend File Map

Prototype file (in `prototype/source/`) → target file in `frontend/src/` of the existing `Honzus/RowOrg` repo.

The target file paths assume a small reorganization to support nested routing and the new pages. Components that are exhibitor-only (TweaksPanel) are NOT mapped — do not ship them.

| Prototype file | Maps to (existing or new) | Notes |
|---|---|---|
| `styles.css` (token layer) | **NEW** `src/styles/tokens.css` | Imported in `main.tsx`. Replaces most of `App.css`. |
| `styles.css` (component layer) | **DELETE** `src/App.css` content / move scoped styles to component-local `.module.css` or keep global if used by many. | The prototype's class names (`.btn`, `.card`, `.lineup`, `.metric`, etc.) are general — keep these global. |
| `ui.jsx` → `Icon` | **NEW** `src/components/Icon.tsx` OR replace with **lucide-react** import. | Lucide is recommended (see DESIGN_TOKENS.md). |
| `ui.jsx` → `Avatar` | **NEW** `src/components/Avatar.tsx` | Accepts `user: User`, `size?: number`. |
| `ui.jsx` → `StatusBadge`, `SideTag` | **NEW** `src/components/Badges.tsx` | |
| `app.jsx` → `App` | Rewrite `src/App.tsx`. Add routes for every page (see route table below). | Keep `BrowserRouter`. |
| `app.jsx` → `Sidebar`, `TopBar`, `MobileTabs` | **NEW** `src/components/Shell/Sidebar.tsx`, `TopBar.tsx`, `MobileTabs.tsx`. Wrap in `src/components/Shell/Layout.tsx` that uses `<Outlet />`. | Layout component becomes the root route element. |
| `app.jsx` → role switcher | In production: render as a *display indicator* of `user.role` (coaches see coach nav, rowers see rower nav). The toggle behavior is designer-only. | Use the same visual pill component but read-only OR replace with a static role badge. |
| `pages.jsx` → `RowerHome` | Replaces `src/pages/RowerDashboard.tsx`. | Rename file to `RowerHome.tsx`. |
| `pages.jsx` → `CoachHome` | Replaces `src/pages/CoachDashboard.tsx`. | Rename to `CoachHome.tsx`. |
| `pages.jsx` → `SessionDetail` | Replaces `src/components/SessionView.tsx`. | Move to `src/pages/SessionDetail.tsx` (it's a routed page now). |
| `pages.jsx` → `SessionRow`, `LineupCard`, `CrewCard`, `SuggestionCard` | **NEW** `src/components/cards/`. | Reusable across pages. |
| `pages.jsx` → `SectionTitle` | **NEW** `src/components/SectionTitle.tsx`. | |
| `extra-pages.jsx` → `RowerLineups` | **NEW** `src/pages/RowerLineups.tsx`. | |
| `extra-pages.jsx` → `RowerAvailability` | **NEW** `src/pages/RowerAvailability.tsx`. | Just wraps `AvailabilityCalendar` with a header. |
| `extra-pages.jsx` → `TeamRoster` | **NEW** `src/pages/TeamRoster.tsx`. | Accepts `role` prop to swap minor copy. |
| `extra-pages.jsx` → `CoachSessions` | **NEW** `src/pages/CoachSessions.tsx`. | |
| `extra-pages.jsx` → `CoachCrews` | **NEW** `src/pages/CoachCrews.tsx`. | |
| `extra-pages.jsx` → `CoachPrefs` | **NEW** `src/pages/CoachPrefs.tsx`. | Includes the Lineup Templates section. |
| `extra-pages.jsx` → `Regattas` | **NEW** `src/pages/Regattas.tsx`. | Static for now. No API. |
| `coach-plan.jsx` → `CoachPlan` | **NEW** `src/pages/CoachPlan.tsx`. | Wires to new `/planning/team-availability/` endpoint. |
| `availability.jsx` → `AvailabilityCalendar` | Replaces `src/components/AvailabilityCalendar.tsx`. | Big change: rewrite to use drag-to-paint instead of click-then-form. See INTERACTIONS.md. |
| `crew-builder.jsx` → `CrewBuilder` | Replaces `src/components/CrewBuilder.tsx`. | Adds Hull variant + Load Template dropdown. |
| `crew-builder.jsx` → `BoatVisual`, `AbstractList`, `SeatDrop`, `DraggableRower` | Co-located helpers in `CrewBuilder.tsx` or split into `src/components/CrewBuilder/`. | |
| `tweaks-panel.jsx` | **DO NOT SHIP.** | Designer-time tool only. |
| `data.js` | **DO NOT SHIP.** | Mock data. Use existing API. |

## Route table

Wire these in `App.tsx`. Use existing `react-router-dom`. Wrap all in a `<Layout>` route that renders the shell + `<Outlet />`.

| Path | Role | Component | Default? |
|---|---|---|---|
| `/login` | public | `Login` (existing) | |
| `/register` | public | `Register` (existing) | |
| `/onboarding/profile` | auth'd | `ProfileSetup` (existing) | |
| `/onboarding/team` | auth'd | `TeamSetup` (existing) | |
| `/` | auth'd | redirect to `/home` | |
| `/home` | both | `RowerHome` or `CoachHome` based on `user.role` | yes |
| `/lineups` | rower | `RowerLineups` | |
| `/availability` | rower | `RowerAvailability` | |
| `/sessions` | coach | `CoachSessions` | |
| `/sessions/:id` | coach | `SessionDetail` | |
| `/plan` | coach | `CoachPlan` | |
| `/crews` | coach | `CoachCrews` | |
| `/team` | both | `TeamRoster` | |
| `/preferences` | coach | `CoachPrefs` | |
| `/regattas` | both | `Regattas` | |

## API client additions (`src/api/`)

Existing modules: `auth.ts`, `availability.ts`, `client.ts`, `sessions.ts`, `teams.ts`.

Add:

- **`templates.ts`** — Lineup template CRUD.
  ```ts
  export const getTemplates = (): Promise<LineupTemplate[]> => client.get('/templates/');
  export const createTemplate = (data: Partial<LineupTemplate>) => client.post('/templates/', data);
  export const updateTemplate = (id: number, data: Partial<LineupTemplate>) => client.patch(`/templates/${id}/`, data);
  export const deleteTemplate = (id: number) => client.delete(`/templates/${id}/`);
  ```
- **`planning.ts`** — team availability aggregate.
  ```ts
  export const getTeamAvailability = (weekStart: string): Promise<TeamAvailabilityBlock[]> =>
    client.get('/planning/team-availability/', { params: { week_start: weekStart } });
  ```

## Type additions (`src/types/index.ts`)

Add:

```ts
export interface LineupTemplate {
  id: number;
  team: string;
  name: string;
  boat_type: string;
  // ordered stroke -> bow (length must match BOAT_TYPE.seats)
  lineup: number[];
  cox: number | null;
  note: string;
  created_by: number;
  created_at: string;
}

export interface TeamAvailabilityBlock {
  day_of_week: number;        // 0=Mon ... 6=Sun
  start_time: string;         // "HH:MM"
  end_time: string;           // "HH:MM"
  count: number;              // how many team members free in this range
  rower_ids?: number[];       // optional drill-down
}
```

## Existing components — what to preserve

- **API client patterns** (`src/api/client.ts` axios instance with auth interceptors) — keep as-is.
- **Auth flow** (Login, Register, ProfileSetup, TeamSetup) — pages do not need redesign in this scope. They can be updated separately with the new token system applied.
- **`getMe`, `getTeam`, `getSessions`, `getSuggestions`, `createCrew`, `confirmCrew`, `cancelCrew`** — all keep their current signatures. Only their consumers change.
- **react-dnd HTML5Backend** in `CrewBuilder` — preserve. Use the same `useDrag`/`useDrop` pattern for both Hull and List variants.
