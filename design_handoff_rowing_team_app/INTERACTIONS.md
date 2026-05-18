# Interactions & Behavior

The details that distinguish a faithful rebuild from a sketch.

## Availability calendar — drag-to-paint

This replaces the existing click-then-form flow.

**State** (per `AvailabilityCalendar`):
- `slots: Availability[]`
- `weekOffset: number`
- `drag: { day, startRow, endRow } | null`

**Mechanics**:
- Grid is 32 rows × 7 day columns. Each row = 30 minutes = 18px.
- `onMouseDown` on a cell sets `drag = { day, startRow: row, endRow: row }`. Calls `preventDefault()` to avoid text selection.
- `onMouseEnter` on any cell — while `drag` is non-null and same day — updates `drag.endRow`. Cross-day drags are not supported (each day is independent).
- `onMouseUp` (window-level listener active while dragging):
  - Compute `a = min(start, end)`, `b = max(start, end) + 1` (inclusive end).
  - Remove any existing slots on this day that overlap `[a, b)`.
  - Insert new slot `{ id: tempId, day, start: rowToTime(a), end: rowToTime(b) }`.
  - POST to `/availability/` and replace tempId with server id on response.
  - Clear `drag`.
- **Drag preview**: while dragging, render a "drafting" coral-dashed slot showing the range and live "{start} – {end}" mono label.
- **Removing a slot**: hover reveals a small ✕ button (top-right of slot). Click → DELETE + optimistic remove from state.

## Crew builder — drag-and-drop

react-dnd HTML5Backend is already a dep. Keep the same `DndProvider` wrapper.

**Source**: each rower chip in roster — `useDrag({ type: 'ROWER', item: rower })`.
**Target**: each seat — `useDrop({ accept: 'ROWER', drop: (rower) => onDropSeat(idx, rower) })`.

**On drop**:
1. If `rower` is already in another seat on this boat, remove from that seat first.
2. Place `rower` in the dropped seat.
3. If the seat is a cox slot AND `rower.role !== 'coxswain' && !rower.can_cox`, still allow (prototype is permissive). Production: show a warning toast but still allow.

**Hover state**: `useDrop` exposes `isOver` — apply `seat-slot--over` class: scale 1.02, `--accent` border, `--accent-soft` background.

## Crew builder — Load Template

When the user picks a template from the "Load template…" dropdown:
1. Switch `boatValue` to `template.boat_type` (triggers seat rebuild via existing `useEffect`).
2. After a 0-tick `setTimeout` (so seats array is rebuilt from the new boat type), fill seats:
   - Seat 1 (bow) ← `template.lineup[lineup.length - 1]`
   - Seat 2 ← `template.lineup[lineup.length - 2]`
   - …
   - Seat N (stroke) ← `template.lineup[0]`
   - Cox slot ← `template.cox`
3. Reset the dropdown back to its placeholder value ("Load template…") so the same template can be re-applied.

If a templated rower no longer exists or is not in the team, leave their seat empty and show a small warning chip in the footer ("2 seats from template couldn't be filled").

## Coach Plan — heatmap rendering

**Per cell color**:
```js
const intensity = Math.min(1, count / 12);
const bg = count > 0
  ? `rgba(182, 240, 106, ${0.08 + intensity * 0.32})`
  : 'transparent';
```

Apply as inline style on every empty cell. The lime hue ramp gives the user a quick visual scan of when coverage is best.

**Per range count label**: for each `TeamAvailabilityBlock` from the API, render an absolutely-positioned `{n}/12` label in lime mono inside that range. The label sits at top-left of the block (offset 4px in, 2px down from the top of the first row).

## Coach Plan — drag-to-create session

Same drag mechanic as availability calendar, but instead of committing on `onMouseUp`, store the range as `draft = { day, startRow, endRow }` and surface a **sticky footer bar**:

```
┌─────────────────────────────────────────────────────────┐
│ NEW SESSION DRAFT                                       │
│ Wednesday · 06:00 – 08:00                               │
│ 10/12 rowers available at this time                     │
│                                                          │
│ [Workout (e.g. 6×8 min @ rate 20)        ]  [Cancel] [Create session] │
└─────────────────────────────────────────────────────────┘
```

- Footer is `position: sticky; bottom: 16px` so it travels with the user as they scroll the heatmap.
- "Cancel" → clears `draft` + workout input.
- "Create session" → POST to `/training_sessions/`, optimistically add to local state, render as coral block on grid, clear `draft`.
- Clicking any existing session block on the grid → navigate to `/sessions/:id`.

## Approve / Cancel crew

On `SessionDetail` → `CrewCard`:
- "Approve" button (lime success style) → PATCH `/training_sessions/{sid}/crews/{cid}/` `{ is_confirmed: true }`. Optimistic update.
- "Cancel" button (danger style) → PATCH `is_cancelled: true`. Card opacity drops to 0.55, stripe turns danger color, buttons hide.

## Filter / sort suggestions

State on `SessionDetail`:
- `filterBoat: 'all' | '8+' | '4+' | '4x' | '2-' | '2x'`
- `sortBy: 'score' | 'boat'`

Apply client-side (suggestions list is short). No re-fetch needed.

## Role-based nav rendering

The sidebar nav items array is computed per `user.role`:
- **Coach** (`role === 'coach'`): Overview, Sessions, Plan, Crews, Roster, Preferences, Regattas.
- **Rower** (`role === 'oarsman' || role === 'coxswain'`): Home, Lineups, Availability, Team, Regattas.

The "role switcher" pill in the prototype is a designer-time toggle. **In production**, render it as a read-only role indicator OR omit it entirely.

## Responsive behavior

- **≥ 1180px**: SessionDetail two-column grid (`1fr 380px`).
- **920–1180px**: SessionDetail stacks; Crew Builder two-column.
- **880–920px**: Crew Builder stacks.
- **< 880px**: Sidebar hidden, mobile bottom tabs visible. Availability grid becomes horizontally scrollable inside its wrapper.

## Optimistic updates

Use TanStack Query (recommend adding — currently the app uses raw `useState` + `useEffect`). All mutations should be optimistic with rollback on error:

- Create availability slot
- Delete availability slot
- Create session
- Create crew (from suggestion or builder)
- Approve crew
- Cancel crew
- Create/update/delete lineup template

## Loading states

- Initial page mount: show a faint skeleton matching the layout, not a spinner. Card skeletons = same dimensions, faded backgrounds. Animation: gentle pulse 1.5s linear infinite.
- In-place actions (Approve, Cancel, Save crew): disable the button + small spinner inline.

## Empty states

Already styled via `.empty-state` (centered text, dashed border, padding 48px). Provide copy that prompts the next action:
- Rower → no lineups: "No lineups assigned yet. Set your availability above and the coach will slot you in."
- Coach → no sessions: "No sessions scheduled. Use the Plan page or create one directly."
- Coach → session has no crews: "No crews assigned yet. Accept a suggestion or build manually below."

## Keyboard shortcuts (future, but reserve)

- `⌘K` — global search/command bar (shown as hint in topbar; not implemented in prototype).
- `←` / `→` on calendar — previous/next week.
- `Esc` — close current drag/draft/template selector.
