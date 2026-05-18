# Screens

Every screen in the prototype, spec'd in detail. Reference `prototype/Rowing Team App.html` to inspect live; reference `prototype/source/*.jsx` for component implementations.

## Global chrome (all screens)

### Sidebar (`248px` wide, desktop only)
- **Brand** at top: 30×30 rounded square (radius 8px) in `--accent`, white "R" in mono bold; next to it "roworg" in 16px/700 with a colored period.
- **Nav groups** with section labels (10px mono uppercase, letter-spacing 0.12em, color `--text-3`).
- **Nav items**: 13.5px/500. Each row = small dot (`--text-3`, switches to `--accent` when active) + icon + label + optional count pill. Active row has `--bg-2` background and `--text-0` text. Hover same.
- **Role switch** (designer-only — in production, rendered conditionally based on `user.role`): pill segmented control (Rower / Coach). Sliding indicator animates with `cubic-bezier(.4, 0, .2, 1)` over 220ms. In production this is a *display indicator* of the user's role, not toggleable.
- **Profile card** at bottom: 32px circular avatar (initials, linear gradient based on user "tint"), name in 12.5px/600, sub line in 11.5px text-2.

### Top bar (full main column width, ~56px tall)
- Left: breadcrumb `<role> / <page>` (13px). Bold for role.
- Right: search icon, bell icon, `⌘K` kbd hint.
- Bottom border `1px var(--border)`.

### Mobile bottom tabs (< 880px)
- Replaces sidebar. Fixed bottom, full width, `--bg-0` background.
- 4 tabs per role. Each: 18px icon + 11px label, active gets `--text-0` color + small accent dot underneath.

---

## ROWER SCREENS

### 1. Rower → Home
Source: `pages.jsx` → `RowerHome`

**Purpose**: Daily landing page — see this week at a glance, set availability, see assigned lineups.

**Layout** (top to bottom):
1. **Page title row** — mono caption "WELCOME BACK", H2 "Hey, {firstName}.", spacer, two buttons right-aligned: "Notify on lineup" (ghost), "Add availability" (primary).
2. **Metric strip** — 4 equal-width cards in a grid with 1px gap (gap rendered via `--border` color background). Each metric: 10px mono uppercase label, 26px/700 tabular value (with optional small unit, e.g. "5.5 h"), 11px trend line (lime or muted mono).
   - Hrs available this wk (current: 14.5h, "↑ 2.5h vs last wk")
   - Practices booked (current: 3, "2 confirmed · 1 draft")
   - On-water hours (current: 4.5h, "Sweep · Port")
   - Avg slot length (current: ~1.8h, "8 slots set")
3. **Section title** — "THIS WEEK'S AVAILABILITY" + hint "Drag any cell on the grid to add a slot. Click ✕ to remove."
4. **Availability calendar** (full component — see §2 below).
5. **Section title** — "MY LINEUPS" + count hint.
6. **Lineup cards grid** — `repeat(auto-fill, minmax(340px, 1fr))`, gap 14px.

### 2. Rower → Availability calendar (component, used in two places)
Source: `availability.jsx` → `AvailabilityCalendar`

**Layout**:
- **Header bar**: prev/next week pill + week label (mono, e.g. "May 11 – 17"), "Today" ghost button, spacer, legend (legend swatches: lime "You're free" / coral "Practice" / blue outline "Team free").
- **Grid**: 1 time column + 7 day columns. Time column = 56px. Each row = 18px (= half hour). Total rows: (END − START) × 2 = 32 rows for 5am–9pm.
  - Time column shows hour labels every other row.
  - Day-column headers: sticky top, day label + day-of-month in mono. Today column header is in `--accent`.
  - Cells: 36px tall (= one hour), dashed dividers on half-hour rows.
- **Slots**: absolutely positioned within their day column. Three kinds:
  - **You're free slot**: `--lime` background, dark text, top-line "You're in" + mono time. Hover reveals ✕ remove.
  - **Practice/session block**: `--accent` background, white text, title + time. Click → open session detail (coach only). For rowers, read-only.
  - **Team-availability underlay**: optional, lower z-index. `--water-soft` fill with a `--water` outline. Shows "{n}/12 free" inside.
- **Drag-paint behavior**: mousedown on a cell starts a draft; mousemove updates `endRow`; mouseup creates the slot (snapping to 30-min boundaries) and removes any overlapping existing slot on the same day.

### 3. Rower → Lineups
Source: `extra-pages.jsx` → `RowerLineups`

**Purpose**: Dedicated view of every crew you're in. Shows status grouping (Approved / Pending / Cancelled).

**Layout**:
- Page title "Lineups", caption "YOUR ASSIGNMENTS · {NAME}". Buttons: Filter, "Notify on new".
- Metric strip (4 cards):
  - Total this week
  - Hours on water
  - Most-used boat (e.g. "8+ Eight")
  - Streak (e.g. "12 wks 🏆 club avg 7")
- Grouped sections: **Approved** → **Pending** → **Cancelled**. Each is `<SectionTitle>` + lineup cards grid (same `LineupCard` as Home).

### 4. Rower → Availability (standalone page)
Source: `extra-pages.jsx` → `RowerAvailability`

Same as the Home embedded view, but standalone — page title "Availability", caption with current week, 3-column metric strip (Hours available / Earliest start / Booked into).

### 5. Rower → Team (Roster)
Source: `extra-pages.jsx` → `TeamRoster` (shared with coach Roster)

**Layout**:
- Page title "Team" or "Roster".
- Filter chip strip: All / Port / Starboard / Scullers / Coxswains / Coaches — each chip shows count badge.
- Grid `repeat(auto-fill, minmax(280px, 1fr))`, gap 12px.
- Each member card:
  - Left stripe color = tint (water/coral/lime).
  - 44px avatar + name (14/600, -0.02em) + role caption (10 mono uppercase).
  - 2×2 mini-grid below: Side (chip showing PORT / STBD / P/S), Weight (mono tabular), Type (sculling/sweeping/both), Cox (lime badge if yes).

### 6. Rower → Regattas
Same as Coach view — `Regattas` component is role-agnostic.

---

## COACH SCREENS

### 7. Coach → Overview (Home)
Source: `pages.jsx` → `CoachHome`

**Purpose**: Coach landing — this week's water time at a glance.

**Layout**:
- Page title "This week's water time" + caption "COACH DASHBOARD · {TEAM NAME}".
- Buttons: Filter (ghost), "New session" (primary).
- Metric strip (4):
  - Sessions this wk
  - Crews scheduled (sub: "{n} confirmed")
  - Active rowers (e.g. "11 / 12")
  - Drafts awaiting (warn color if > 0)
- Section title "SCHEDULED SESSIONS" + count.
- **Session rows** (see §11 below).

### 8. Coach → Plan (NEW)
Source: `coach-plan.jsx` → `CoachPlan`

**Purpose**: Create sessions *informed by* team availability. A team-wide heatmap of when rowers are free, with drag-to-create.

**Layout**:
- Page title "Plan sessions" + caption with current week range.
- Buttons: "Min rowers" (filter — future feature), "Quick add" (primary).
- Metric strip (4):
  - Best availability — peak count + day/time (e.g. "10/12 Wed 06:00")
  - Already scheduled — count + sub "{n} crews"
  - Avg available · 06:00
  - Coverage % team-wide this week
- Instructional p-tag: "Heatmap shows how many rowers are free in each half-hour. **Drag across empty cells** to draft a session at that time — coverage will be highest where the green is most intense."
- **Heatmap grid**: same structure as the rower availability calendar BUT cells are tinted by count: `rgba(182, 240, 106, 0.08 + intensity * 0.32)` where intensity is `count/12`. Count label printed inside each contiguous range ("8/12" in lime mono).
- Existing sessions overlay as coral session blocks; clicking them opens session detail.
- **Drag-paint to create**: same drag mechanic as availability. On mouseup, instead of creating the slot directly, it commits to a "draft" state and shows a **sticky footer bar** at the bottom of the page:
  - "NEW SESSION DRAFT"
  - "{Day} · {start} – {end}"
  - "{count}/12 rowers available at this time" (mono caption)
  - Workout description input
  - Cancel / "Create session" (primary) buttons
- Submit → POST to `/training_sessions/`, new session appears on grid in coral.

### 9. Coach → Sessions (list)
Source: `extra-pages.jsx` → `CoachSessions`

Page title "Sessions" + caption "PRACTICE SCHEDULE · {date range}". Buttons: Week (view toggle, future), "New session" (primary). Instructional p-tag. Then `<SectionTitle title="This week" />` + list of `<SessionRow>`.

### 10. Coach → Crews (all crews this week)
Source: `extra-pages.jsx` → `CoachCrews`

Filter chips by status (All / Confirmed / Draft / Cancelled). Grid `repeat(auto-fill, minmax(380px, 1fr))`. Each card shows date block, boat type + status badge, time + session title, 2-column seat list with avatars.

### 11. Coach → Session detail
Source: `pages.jsx` → `SessionDetail`

**Purpose**: Manage a single session — approve/cancel crews, accept suggestions, build manually.

**Layout**:
- Title row: breadcrumb back-link "‹ SESSIONS · {day, date, time}", H2 = session title, buttons: "Edit session", "Generate suggestions" (primary, with bolt icon).
- Workout description card (coral left border).
- **Two-column detail grid** (`1fr 380px`, stacks at 1180px):
  - **Left**: Assigned crews section → `<CrewCard>` list. Each crew card has stripe color by status, boat type tag, status badge, Approve/Cancel buttons (right-aligned), 2-column seat list. Then `<SectionTitle title="Crew builder" hint="Drag rowers into seats · ⌘K roster search" />` + `<CrewBuilder>`.
  - **Right**: Suggestions panel. SectionTitle + filter strip (boat-type chips: All / 8+ / 4+ / 4x / 2- / 2x) + sort select. `<SuggestionCard>` list — each shows boat tag, score bar (gradient `--accent` → `--lime`, fills based on score 0–100), rower list with avatars + weight, "Preview" + "Accept" buttons.

**SessionRow** (used by Overview and Sessions list):
Grid `56px 1fr auto auto`. Date block (mono day-of-month + 3-letter month). Meta = "{Day} · {start} – {end}" mono caption + bold title + description sub-line. Crew pills (boat type, colored by status). Right arrow.

### 12. Coach → Crew Builder (component)
Source: `crew-builder.jsx` → `CrewBuilder`

**Header row** (inside `.boat-builder`):
- Boat-type `<select>` (1x through 8+)
- **NEW** Load-template `<select>` — labeled "Load template…", populated from `D.TEMPLATES`. Selecting one swaps to the template's boat type and fills every seat with `findUser(rowerId)` — stroke at top, bow at seat 1, cox in cox slot.
- Spacer
- View tabs: Hull / List (segmented). State is hoisted to parent (so it can be controlled by Tweaks in the prototype; in prod, it can be local).

**Two-column body** (stacks at 920px):
- **Roster** — left, 280px. Mono "Available · {n}" header. Each available rower:
  - `<rower-chip>` 24px avatar + name (12.5/500) + meta line ("kg" weight, side tag colored P/S, "+COX" hint if applicable).
  - `draggable=true`. On drag, opacity drops to 0.4.
- **Boat stage** — right, the actual seat layout:
  - **Hull variant**: Stern label at top, hull container with rounded-top + boxy-bottom border-radius. Cox at top (if coxed boat — uses fully-rounded "cox-seat" style with `--water` tint). Then a column of rows, ordered stroke (highest seat #) → bow (seat 1). Each row: left "oar" indicator (▸◂) colored by side, center seat block, right oar indicator. Empty state: dashed border + italic placeholder text. Filled: solid bg + avatar + name + ✕ remove on hover. Drop-target hover: `--accent` border, `--accent-soft` bg, scale 1.02.
  - **List variant**: Vertical list of rows in seat order. Each row = grid `36px 1fr 64px`: large mono seat number, name (or placeholder), right-aligned side tag.

**Footer**:
- Stats row: Filled (e.g. "8/8"), Avg weight (kg), P/S balance (lime when equal, warn when unequal).
- Spacer
- "Clear" (ghost), "Save crew" (primary, disabled until filled).

### 13. Coach → Preferences
Source: `extra-pages.jsx` → `CoachPrefs`

**Purpose**: Tell the suggestion engine how you like crews built.

**Layout** (top to bottom):
1. Page title "Preferences" + caption "LINEUP RULES · INFORMS THE SUGGESTION ENGINE" + "Add rule" primary button.
2. **NEW Lineup Templates section** — `<SectionTitle title="Lineup templates" hint="Full stroke-to-bow lineups. Suggestions use these as starting points; the Crew Builder can load them in one click." />`. Grid `repeat(auto-fill, minmax(340px, 1fr))`, gap 10px.
   - Each template card: coral stripe; header row with boat-type tag + name + boat-label sub + settings icon button; note line (text-2); column of seat rows from stroke (top, "STK") to bow (bottom, "BOW"), with side tags. Cox row at the very bottom if applicable (water color).
   - **"Add" card** at the end: dashed border `--border-strong`, plus icon + "New lineup template" + "Stroke → bow" mono caption.
3. **Two-column detail grid** below:
   - **Left**: Preferred pairings. Each pairing rendered as a suggestion-style card: boat tag + 2-3 stacked rowers (avatar + name) + right-aligned note.
   - **Right**: Seat preferences. Stacked rows: avatar + name + boat sub + seat badge (water) + priority badge (Locked=coral, High=lime, Med=plain).

### 14. Coach → Roster
Same as Rower → Team component, but with an extra "Invite rower" primary button in the header.

### 15. Coach → Regattas
Same as Rower → Regattas.

---

## Empty states

When a list is empty:
```html
<div class="empty-state">No lineups assigned yet. Set your availability above…</div>
```
Style: text-center, padding 48px 20px, color text-2, dashed `--border` outline, radius `--r-lg`.

---

See `INTERACTIONS.md` for drag/hover/transition behavior details.
