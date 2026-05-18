# Design Tokens

A single source of truth. Recreate as CSS custom properties on `:root` (or as a TypeScript constants file consumed via CSS-in-JS, if preferred). All values come from `prototype/source/styles.css`.

## Typography

- **Font family — sans**: `'Geist', system-ui, -apple-system, sans-serif`
- **Font family — mono**: `'Geist Mono', ui-monospace, monospace`
- Load both from Google Fonts: `https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500;600&display=swap`
- Body: `font-feature-settings: 'ss01', 'cv11'` + `-webkit-font-smoothing: antialiased`

### Type scale (used)

| Use | Size | Weight | Letter-spacing |
|---|---|---|---|
| Page H2 | 28px | 700 | -0.03em |
| Page H3 / card title | 13px | 600 | -0.01em (uppercase, mono, color text-1) |
| Body | 13.5px | 400 | 0 |
| Body small | 12.5px | 400 | 0 |
| Metric value | 26px | 700 tabular | -0.03em |
| Mono caption | 10–11px | 500 mono uppercase | 0.08–0.12em |
| KBD | 10.5px | 500 mono | 0 |

## Color tokens (production — "Slate" palette)

The prototype's Tweaks panel exposes 3 palettes (Slate / Lake / Dusk). **Ship Slate only.**

### Surfaces
```css
--bg-0:   #08090d;  /* sidebar / deepest */
--bg-1:   #0e1118;  /* app background */
--bg-2:   #151924;  /* card surface */
--bg-3:   #1c2230;  /* nested card / chip */
--bg-4:   #232a3c;  /* hover surface */
--border:        #242b3c;
--border-strong: #323b52;
```

### Text
```css
--text-0: #f4f1ea;  /* primary */
--text-1: #a4adc4;  /* secondary */
--text-2: #6c7691;  /* tertiary / muted */
--text-3: #4a536a;  /* hint / placeholder */
```

### Signal colors
```css
--accent:        #ff5d3a;   /* primary action, "session" blocks */
--accent-soft:   #ff5d3a26; /* hover wash, hover-drop wash */
--accent-press:  #e64a28;
--lime:          #b6f06a;   /* "you're free", "confirmed", positive */
--lime-soft:     #b6f06a1f;
--water:         #66a7ff;   /* port side, cox slot, team-heatmap underlay */
--water-soft:    #66a7ff1f;
--warn:          #ffb43a;   /* draft state */
--danger:        #ff4f6b;   /* cancel, errors */
```

### Semantic mapping (use these in component code, not raw hex)
- **Port side** → `--water`
- **Starboard side** → `--accent`
- **Cox** → `--water`
- **Confirmed crew/lineup** → `--lime`
- **Draft crew/lineup** → `--warn`
- **Cancelled crew/lineup** → `--danger`

## Radius
```css
--r-sm: 6px;   /* buttons, chips */
--r-md: 10px;  /* selects, small cards */
--r-lg: 14px;  /* large cards, panels */
--r-xl: 20px;  /* pill-shaped containers */
```

## Spacing scale
```css
--gap-1: 4px;
--gap-2: 8px;
--gap-3: 12px;
--gap-4: 16px;
--gap-5: 24px;
--gap-6: 32px;
```

Standard page padding: `24px 32px 80px` desktop, `16px 16px 100px` mobile (extra bottom for tab bar).

## Shadows
```css
--shadow-1: 0 1px 0 rgba(255,255,255,.04) inset, 0 1px 2px rgba(0,0,0,.4);
--shadow-2: 0 1px 0 rgba(255,255,255,.05) inset, 0 8px 24px rgba(0,0,0,.35);
```

Primary buttons get a small accent glow: `0 1px 0 rgba(255,255,255,.2) inset, 0 4px 14px -4px var(--accent)`.

## Scrollbar
```css
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-thumb { background: var(--bg-3); border-radius: 8px; border: 2px solid var(--bg-1); }
::-webkit-scrollbar-thumb:hover { background: var(--bg-4); }
```

## Layout constants

- **Sidebar width** (desktop ≥ 880px): `248px`
- **Top bar height**: ~`56px`
- **Mobile breakpoint**: `880px` (sidebar collapses, mobile-tabs appear)
- **Calendar tablet breakpoint**: `768px` (week-grid becomes horizontal scroll)
- **Detail two-column → stacked**: `1180px`
- **Builder two-column → stacked**: `920px`

## Animation

- All hover transitions: `transition: color .12s, background .12s, border-color .12s`
- Role-switch pill slide: `transition: transform .22s cubic-bezier(.4, 0, .2, 1)`
- Drop-target highlight: `transition: all .15s` + `transform: scale(1.02)`
- Button press: `transform: translateY(1px)`

## Iconography

The prototype uses a tiny inline SVG icon component (`Icon` in `ui.jsx`) — 24×24 viewBox, 1.6 stroke, round caps/joins. For production, recommend **Lucide React** (already a stylistic match) for the same look without maintaining an icon file. Mapping:

| Prototype name | Lucide equivalent |
|---|---|
| `home` | `Home` |
| `calendar` | `Calendar` |
| `boat` | `Anchor` or `Ship` |
| `users` | `Users` |
| `bolt` | `Zap` |
| `filter` | `Filter` |
| `chevL` / `chevR` | `ChevronLeft` / `ChevronRight` |
| `plus` | `Plus` |
| `check` | `Check` |
| `x` | `X` |
| `search` | `Search` |
| `settings` | `Settings` |
| `bell` | `Bell` |
| `trophy` | `Trophy` |
| `list` / `grid` | `List` / `Grid3x3` |
