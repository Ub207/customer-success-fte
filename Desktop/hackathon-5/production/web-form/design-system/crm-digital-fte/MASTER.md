# CRM Digital FTE — Design System (MASTER)

**Source of truth.** Page-specific overrides live in `pages/` and take precedence over this file.
Scope: `production/web-form/` — the Next.js support app (3 dashboards, support form, ticket status page).

| | |
|---|---|
| **Product** | B2B support / CRM operations console + customer-facing support surfaces |
| **Stack** | Next.js 14.1 (Pages Router) · React 18 · Tailwind CSS 3.4 |
| **Direction** | Light operations base + scoped glass accent |
| **Status** | Authored 2026-09-13 · not yet implemented |

---

## Provenance — read this before trusting a number

This system merges three inputs, and they disagree in places. Know which is which:

| Section | Source | Confidence |
|---|---|---|
| Color base, typography, radius, shadow, motion | **Measured from the existing code** (`tailwind.config.js`, `globals.css`, `_app.js`) | Exact |
| Contrast verdicts | **Computed** with the WCAG 2.1 relative-luminance formula this session | Exact — re-runnable |
| Glass accent token values | **Skill DB match** (`style` → Glassmorphism) | Recommendation |
| Typography *pairing* alternative | **Skill DB match** (Fira Code / Fira Sans, "Dashboard Data") | Recommendation — **not adopted**, see §3 |
| Product/pattern guidance | **Skill DB match** — returns *landing-page* patterns, poor fit for an in-app console | Weak — see §11 |

Two queries returned off-topic results and are recorded as such rather than silently used:

- `"helpdesk support ticket triage dashboard" --domain product` → matched **Event Management**,
  **Ticketing/Box Office** (event-ticketing), then *Analytics Dashboard*. The helpdesk domain is not
  in the dataset; only the third result is relevant.
- `--design-system` returned a **landing-page** pattern ("Real-Time / Operations Landing") with hero →
  metrics → how-it-works → CTA. The dashboards are authenticated consoles, not landing pages. Its
  *dark glassmorphism + Fira* output was deliberately not adopted wholesale — the user chose a light
  base with scoped glass accents instead.

---

## 1. Principles

1. **Light for work, glass for signal.** Operators read light surfaces for hours. Glass is reserved for
   chrome and emphasis panels, never for content that must be read.
2. **Data density is a feature, not a defect.** This is a triage console. Do not pad it into a marketing page.
3. **State is never color-only.** Every status carries a dot, a label, or an icon in addition to hue.
4. **Tokens or nothing.** No raw hex in components. No arbitrary Tailwind values where a token exists.
5. **Motion explains, never decorates.** Movement conveys arrival, change, or progress — or it is cut.

---

## 2. Color

### 2.1 Base tokens (light — measured from the current code)

Existing `brand` and `surface` scales are **kept as-is**. They are sound; the problem was never the
palette, it was that components bypassed it (§10).

```css
/* Brand — violet. Action, selection, focus, identity. */
--brand-50:  #FAF5FF;  /* oklch(97.7% 0.014 308.3) */
--brand-100: #F3E8FF;  /* oklch(94.6% 0.033 307.2) */
--brand-200: #E9D5FF;  /* oklch(90.2% 0.060 306.7) */
--brand-300: #D8B4FE;  /* oklch(82.7% 0.108 306.4) */
--brand-400: #A855F7;  /* oklch(62.7% 0.233 303.9) */
--brand-500: #8B5CF6;  /* oklch(60.6% 0.219 292.7) */
--brand-600: #7C3AED;  /* oklch(54.1% 0.247 293.0)  ← primary action */
--brand-700: #6D28D9;  /* oklch(49.1% 0.241 292.6)  ← hover / pressed */
--brand-800: #5B21B6;  /* oklch(43.2% 0.211 292.8) */
--brand-900: #4C1D95;  /* oklch(38.0% 0.178 293.7) */

/* Surface — cool slate. Structure, text, borders. */
--surface-0:   #FFFFFF;  /* oklch(100.0% 0.000  —)     card */
--surface-50:  #F8FAFC;  /* oklch(98.4%  0.003 247.9)  app background */
--surface-100: #F1F5F9;  /* oklch(96.8%  0.007 247.9)  inset panel, divider */
--surface-200: #E2E8F0;  /* oklch(92.9%  0.013 255.5)  border */
--surface-300: #CBD5E1;  /* oklch(86.9%  0.020 252.9)  border strong, disabled */
--surface-400: #94A3B8;  /* oklch(71.1%  0.035 256.8)  ⚠ decorative only — see §2.3 */
--surface-500: #64748B;  /* oklch(55.4%  0.041 257.4)  secondary text (min) */
--surface-600: #475569;  /* oklch(44.6%  0.037 257.3)  body text */
--surface-700: #334155;  /* oklch(37.2%  0.039 257.3)  strong body */
--surface-800: #1E293B;  /* oklch(27.9%  0.037 260.0)  heading */
--surface-900: #0F172A;  /* oklch(20.8%  0.040 265.8)  max-contrast text, dark panel */
--surface-950: #020617;  /* oklch(12.9%  0.041 264.7) */
```

### 2.2 Status tokens

Use these instead of the raw Tailwind `red-*`/`green-*`/`orange-*` utilities currently scattered through
the dashboards. Pair the **-bg** and **-text** columns; the pairings below are contrast-verified.

| Role | bg | text | dot | Meaning |
|---|---|---|---|---|
| `success` | `#ECFDF5` | `#047857` | `#10B981` | resolved, sent, delivered |
| `warning` | `#FFFBEB` | `#B45309` | `#F59E0B` | medium priority, queued, pending |
| `danger` | `#FEF2F2` | `#B91C1C` | `#EF4444` | urgent, failed, escalated-critical |
| `info` | `#EFF6FF` | `#2563EB` | `#3B82F6` | processing, in-flight, active |
| `neutral` | `#F1F5F9` | `#475569` | `#94A3B8` | low priority, closed, inert |

`danger` on `#FEF2F2` uses **`#B91C1C`, not `#DC2626`** — `#DC2626` measures 4.41:1, which fails the
4.5:1 normal-text threshold. `#B91C1C` clears it. This is the only status hue where the obvious
Tailwind shade was wrong.

### 2.3 Measured contrast — the binding constraints

Computed this session with the WCAG 2.1 relative-luminance formula against the actual token values.
**These two rules are not stylistic preferences; they are failures.**

| Pair | Ratio | 4.5:1 | Verdict |
|---|---|---|---|
| `#0F172A` on `#FFFFFF` | 17.85 | ✓ | PASS |
| `#0F172A` on `#F8FAFC` | 17.06 | ✓ | PASS |
| `#334155` on `#FFFFFF` | 10.35 | ✓ | PASS |
| `#475569` on `#FFFFFF` | 7.58 | ✓ | PASS |
| `#475569` on `#F8FAFC` | 7.24 | ✓ | PASS |
| `#64748B` on `#FFFFFF` | 4.76 | ✓ | PASS |
| `#64748B` on `#F8FAFC` | 4.55 | ✓ | PASS — barely; do not lighten |
| **`#94A3B8` on `#FFFFFF`** | **2.56** | ✗ | **FAIL** |
| **`#94A3B8` on `#F8FAFC`** | **2.45** | ✗ | **FAIL** |
| `#7C3AED` on `#FFFFFF` | 5.70 | ✓ | PASS |
| `#FFFFFF` on `#7C3AED` | 5.70 | ✓ | PASS |
| `#F3E8FF` on `#7C3AED` | 4.83 | ✓ | PASS |
| `#E9D5FF` on `#7C3AED` | 4.19 | ✗ | LARGE-ONLY (≥18.66px bold / 24px) |
| `#047857` on `#ECFDF5` | 5.21 | ✓ | PASS |
| `#B45309` on `#FFFBEB` | 4.84 | ✓ | PASS |
| `#2563EB` on `#EFF6FF` | 4.75 | ✓ | PASS |
| `#94A3B8` on `#0F172A` | 6.96 | ✓ | PASS (dark panel) |
| `#64748B` on `#0F172A` | 3.75 | ✗ | LARGE-ONLY (dark panel) |

**Rule A — `surface-400` is a decorative token.**
At 2.56:1 it is not text. Permitted: borders, dividers, `aria-hidden` icon glyphs, disabled affordances,
placeholder *in a non-essential hint*. Forbidden: timestamps, metadata, helper text, captions, any
customer-visible label. `surface-500` (4.55:1) is the **floor for real text** on light surfaces.
This is currently violated in ~15 places — see §10.

**Rule B — `brand-200` as a label on `brand-600` fails.**
The dashboard list header (`WebFormDashboard.jsx:727`, `bg-brand-600` + `text-brand-200`, 12px uppercase
bold) measures 4.19:1. 12px is far below the large-text threshold (≥18.66px bold), so the 3:1 allowance
does not apply and this **fails**. Use `brand-100` (4.83:1).

**Scrim rule.** Any overlay must be measured against the *composed* background, not the nominal surface.
Glass panels over `surface-50` must still deliver ≥4.5:1 for their text.

### 2.4 Glass accent tokens

Scoped, not global. Applies only to: the flow-diagram panel, the API reference code block, and the
sticky nav overlay.

```css
--glass-panel-bg:     rgba(15, 23, 42, 0.92);   /* surface-900 @ 92% */
--glass-panel-border: 1px solid rgba(255, 255, 255, 0.12);
--glass-panel-blur:   blur(12px);
--glass-panel-radius: 12px;
--glass-text:         #F8FAFC;                  /* surface-50 */
--glass-text-muted:   #94A3B8;                  /* surface-400 — 6.96:1 on surface-900 ✓ */
--glass-text-dim:     #64748B;                  /* surface-500 — 3.75:1, large text / decorative only */
```

**Why scoped.** Glassmorphism carries a conditional accessibility risk in the skill data
(`requires: contrast-text-4.5, keyboard, visible-focus, reduced-motion`). It is safe when the backdrop is
opaque and known; it is unsafe over scrolling content or photography. A console's flow diagram sits on a
flat `surface-50` field — that's the safe case. Ticket rows and form inputs sit next to variable content —
that's not.

**Performance note.** `backdrop-filter` forces a compositing layer. Keep glass panels to ≤3 per view and
never inside a scrolling list item. The current flow panel is already `bg-surface-900`; converting to true
glass is a *visual* upgrade, not a functional one — skip it if it costs frames.

---

## 3. Typography

**Adopted: keep the existing pairing.** Plus Jakarta Sans + JetBrains Mono, already wired through
`next/font/google` in `pages/_app.js` with `display: 'swap'` and CSS variables. This is self-hosted,
layout-shift-free, and zero-cost to keep.

```css
--font-sans: var(--font-jakarta), system-ui, -apple-system, sans-serif;
--font-mono: var(--font-mono), ui-monospace, SFMono-Regular, monospace;
```

The skill DB returned **Fira Code / Fira Sans ("Dashboard Data")** as its top dashboard pairing.
**Not adopted.** Switching would cost a font re-download, re-flow, and full re-verification of every
layout for no user-visible benefit — Plus Jakarta Sans is already an enterprise-SaaS-grade geometric
sans (the DB's own "Enterprise SaaS" pairing entry names it). Recorded here so the decision is deliberate
rather than forgotten. Revisit only if the front-end is rebuilt.

### Scale

| Token | Size / line-height | Weight | Use |
|---|---|---|---|
| `display` | 48 / 1.1 | 800 | Support-page hero only |
| `h1` | 30 / 1.2 | 800 | Page title |
| `h2` | 20 / 1.3 | 700 | Panel / section title |
| `h3` | 16 / 1.4 | 700 | Card title |
| `body` | 14 / 1.5 | 400 | Default UI text |
| `body-sm` | 13 / 1.5 | 500 | Form labels, dense rows |
| `caption` | 12 / 1.4 | 500 | Metadata — **`surface-500` minimum** |
| `micro` | 11 / 1.4 | 600 | Uppercase section headers only, `tracking-wider` |
| `mono` | 13 / 1.5 | 500 | Ticket IDs, Kafka topics, latency, code |

**Rules**
- Body minimum 14px. Nothing customer-facing below 12px.
- **12px is the absolute floor, and it applies to uppercase tracking labels too.** `micro` (11px) is
  permitted **only** uppercase + `letter-spacing: 0.05em`, where the tracking offsets the size. Never
  11px lowercase. Two current violations: `SupportForm.jsx:84` (11px lowercase hint) and
  `SupportForm.jsx:122` (10px label) — both need to come up to 12px.
- Ticket IDs, topics, and metric values are always `font-mono` — they are data, and monospace is what
  makes them scannable in a dense list.
- Long-form text (customer messages, AI responses) caps at `65ch`; currently uncapped in
  `WebFormDashboard`'s AI-response `<pre>`.

---

## 4. Spacing

4px base unit; 8px rhythm for component-level spacing.

| Token | px | Use |
|---|---|---|
| `space-1` | 4 | Icon-to-label gap |
| `space-2` | 8 | Inside a chip; tight stacks |
| `space-3` | 12 | Card padding (dense), grid gap |
| `space-4` | 16 | Card padding (default), row padding |
| `space-5` | 20 | Form field vertical rhythm |
| `space-6` | 24 | Section gap |
| `space-8` | 32 | Block gap |
| `space-12` | 48 | Page section gap |
| `space-16` | 64 | Hero / marketing only |

Dashboard surfaces run **dense** (gaps of 12–16px); the customer-facing support page runs **standard**
(20–32px). Do not mix: a dense console and a spacious form are different contexts, and that is correct.

**Touch targets.** Minimum 44×44px interactive area on touch devices — expand the *hit area*
(`min-h-11`, padding, or a `::before` overlay), not necessarily the visual size. Chips and pills at
`px-1.5 py-0.5` measure roughly 18px tall and are non-compliant when clickable. Read-only status
pills are exempt; anything with an `onClick` is not.

---

## 5. Radius

| Token | Value | Use |
|---|---|---|
| `rounded-sm` | 4px | Chips, inline code, badges |
| `rounded-md` | 6px | Inputs, small buttons |
| `rounded-lg` | 8px | Buttons, nav items, logo mark |
| `rounded-xl` | 12px | Cards, panels, glass surfaces, icon tiles |
| `rounded-2xl` | 16px | Page-level cards, modal |
| `rounded-full` | 9999px | Status pills, avatars, filter chips |

Nesting rule: a child radius = parent radius − padding, floored at 4px. A `rounded-xl` card with 16px
padding contains `rounded-md` children (12 − 8 ≈ 4, but 6 reads better).

---

## 6. Elevation

Existing shadow tokens are sound — keep them, and **resolve the current inconsistency**: `WebFormDashboard`
uses `shadow-card` on its container where `GmailDashboard` uses the same token on a different element type.

| Token | Value | Use |
|---|---|---|
| `shadow-xs` | `0 1px 2px rgb(0 0 0 / 0.04)` | Inputs, subtle separation |
| `shadow-card` | `0 1px 3px … / 0.06, 0 1px 2px -1px … / 0.06` | Resting card |
| `shadow-card-hover` | `0 4px 12px -2px … / 0.08, …` | Card hover |
| `shadow-elevated` | `0 12px 40px -8px … / 0.12, …` | Modal, popover, dropdown |
| `shadow-glow-{brand,red,green,blue}` | `0 0 0 3px <hue> / 0.15` | Focus/state halo on icon affordances |

**Flat-by-default.** A card is `shadow-card` + a `surface-200` border. Do not stack heavy shadows —
depth comes from borders and background contrast, not from drop shadows. The only `shadow-elevated`
surfaces are modals and the form card on the support landing page.

---

## 7. Motion

| Token | Duration | Easing | Use |
|---|---|---|---|
| `instant` | 100ms | `linear` | Color/opacity on hover of dense list rows |
| `fast` | 150ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Chips, icons, small state changes |
| `base` | 200ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Buttons, cards, tab underline |
| `slow` | 300ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Panel entry, tab content swap |
| `reveal` | 350ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Page-level `animate-fade-up` |

- **Exit faster than enter.** Dismissals run at ~60% of their entry duration.
- **Never animate `width`/`height`/`margin`.** Transform and opacity only.
- **Stagger** list reveals at 0.02–0.04s per item, capped at 0.1s; total under ~400ms. Select by stable
  `data-*` attribute, not array index, so React re-renders don't retarget.
- **Hover displacement ≤2px.** More reads as motion, not feedback.
- **`prefers-reduced-motion` is mandatory.** Already correctly handled in `globals.css` with the
  `0.01ms !important` override — preserve it. Under reduced motion, render the final state immediately.

---

## 8. Focus

Already implemented correctly in `globals.css` — this is a **keep, don't touch**:

```css
:focus-visible { outline: 2px solid #7C3AED; outline-offset: 2px; border-radius: 4px; }
:focus:not(:focus-visible) { outline: none; }
```

Extensions:
- Offset 2px minimum so the ring is never clipped by `overflow-hidden` parents. Where a parent clips,
  use `ring-inset` instead (the ticket rows already do this correctly).
- Never `outline: none` without a replacement ring.
- Sticky headers must not obscure focused elements — `scroll-padding-top: 80px` is already set on `html`;
  keep it in sync with the real nav height.
- The focus ring color `#7C3AED` on `brand-600` backgrounds needs a white variant — use
  `ring-white` when the focused element sits on a brand-600 surface.

---

## 9. Components

### 9.1 Button

| Variant | Rest | Hover | Active | Focus |
|---|---|---|---|---|
| `primary` | `bg-brand-600 text-white` | `bg-brand-700` | `scale(0.98)` | `ring-2 ring-brand-500 ring-offset-2` |
| `secondary` | `bg-white border-surface-200 text-surface-600` | `bg-surface-50` | `scale(0.98)` | same |
| `danger` | `bg-red-600 text-white` | `bg-red-700` | `scale(0.98)` | `ring-red-500` |
| `ghost` | transparent, `text-surface-500` | `bg-surface-100` | — | same |

Sizes: `sm` 32px · `md` 40px · `lg` 44px. Padding `px-4 py-2.5` at `md`.
Disabled: `opacity-50 cursor-not-allowed`, plus real `disabled` semantics — never a purely visual disable.
Loading: swap the leading icon for a spinner, keep the label or replace with "Processing…", set `disabled`,
and preserve width so the button doesn't jump. `SupportForm`'s submit already does this correctly.

**`cursor-pointer` on every clickable element.** Tailwind's preflight sets `cursor: default` on buttons —
the dashboards patch this ad hoc. Add a global rule:

```css
@layer base { button:not(:disabled) { cursor: pointer; } }
```

### 9.2 Status pill

```jsx
<span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium
                 bg-[--status-bg] text-[--status-text]">
  <span className="h-1.5 w-1.5 rounded-full bg-[--status-dot]" aria-hidden="true" />
  {label}
</span>
```

Non-negotiable: **dot + label, never color alone.** §2.2 supplies the pairs. When the pill is a filter
control, it must reach 44×44px hit area via padding (§4).

### 9.3 Input / Select / Textarea

`SupportForm`'s implementation is the reference — reuse it verbatim:

- Visible `<label>` always. Placeholder is never the label.
- Border `surface-200`, `shadow-xs`, `rounded-lg`, `px-3.5 py-2.5`, 14px text.
- Focus: `ring-2 ring-brand-500/15 border-brand-400`. **Focus and error rings are distinct** — that
  distinction is correct; maintain it.
- Error: border moves to `red-300`, background to `red-50/30`, message below the field with
  `role="alert"`, wired via `aria-describedby` + `aria-invalid`. Error text uses `#B91C1C`.
- Helper/hint text sits in the label row, right-aligned, `surface-500` minimum (§2.3 Rule A).
- Character counters are hints, not errors — don't turn them red until the limit is exceeded.

### 9.4 Card

```
bg-surface-0 · border-surface-200 · rounded-xl · shadow-card · p-4 (dense) / p-6 (standard)
```

Header: `border-b border-surface-100`, `px-6 py-4`, title `h3` + optional `caption` subtitle.
Interactive cards use `card-interactive` from `globals.css` (hover shadow + 1px lift).

### 9.5 Master–detail split view

Used by all three dashboards. Current implementation is **broken on mobile** (§10.2). Target spec:

| Breakpoint | Behaviour |
|---|---|
| `< 1024px` | Single column. List is the page. Selecting a row navigates to detail (route or full-screen overlay) with a visible back affordance. |
| `≥ 1024px` | Two columns: `grid-template-columns: 340px minmax(0, 1fr)`. |

- Use `1fr` → `minmax(0, 1fr)` on the detail column so long content can't blow out the grid.
- List column gets `overflow-y: auto`; the detail column manages its own scroll region.
- Row height ≥44px on touch.
- Filter chips become a horizontally scrollable row with `overflow-x-auto` and edge fade below 768px
  rather than wrapping unpredictably.
- The selected row needs a **non-color indicator** — the current 4px left border is good; keep it.

### 9.6 Tabs

`role="tablist"` / `role="tab"` / `aria-selected` / `aria-controls` / `id` pairing — `WebFormDashboard`'s
`TicketDetail` implements the full ARIA contract correctly. Copy it. Add keyboard support:
`←`/`→` move between tabs, `Home`/`End` jump to first/last. Currently missing.

### 9.7 Empty & loading states

- **Skeleton** for >300ms loads, using the existing `.skeleton` shimmer.
- **Spinner + text** for indeterminate work (`role="status"`).
- **Empty state**: icon, one-line explanation, one action. Never a bare "No data".
- Reserve space to keep CLS < 0.1 — the ticket list uses a fixed-height container for exactly this; keep it.

---

## 10. Current-state findings

Reported, not fixed, in this pass. Ordered by severity.

### 10.1 `role="status"` misuse — HIGH

`role="status"` is an implicit `aria-live="polite"` region. It must wrap **one** short message that
changes, and should be `aria-atomic="true"`. It is currently applied to large static blocks, which makes
screen readers announce the entire subtree on every re-render.

| Location | Problem |
|---|---|
| `WebFormDashboard.jsx:396` | `role="status"` on the 4-stat grid → re-announces all four numbers on each poll |
| `WebFormDashboard.jsx:701` | `role="status"` on a static "FastAPI Active" label |
| `WhatsAppDashboard.jsx:331` | `role="status"` on the stat grid |
| `WhatsAppDashboard.jsx:371` | `role="status"` on a decorative pulse dot |
| `pages/ticket/[id].js:50` | `role="status"` on every status badge instance |
| `pages/ticket/[id].js:156` | `role="status"` on the loading block |
| `GmailDashboard.jsx:496` | `role="status"` on a static connection label |

**Target pattern** — one atomic live region per view, announcing a contextual sentence:

```jsx
<span role="status" aria-atomic="true" className="sr-only">
  {`${tickets.length} tickets, ${resolved} resolved`}
</span>
```

Static labels use no live role at all. Decorative dots get `aria-hidden="true"`.

### 10.2 Master–detail split views are desktop-only — HIGH

Inline styles hardcode a fixed pixel column with no breakpoint:

- `WebFormDashboard.jsx:725` — `gridTemplateColumns: '340px 1fr'`
- `GmailDashboard.jsx:531` — `gridTemplateColumns: '340px 1fr'`
- `WhatsAppDashboard.jsx:399` — `gridTemplateColumns: '300px 1fr'`

At a 375px viewport the list column alone exceeds the screen; the detail pane is pushed off-canvas with
no horizontal scroll container. Fix per §9.5.

### 10.3 Sub-44px interactive targets — HIGH

Filter chips and toggle pills at `px-1.5 py-0.5` / `px-2 py-1` render ~18–24px tall:

- `GmailDashboard.jsx:286, 328, 331`
- `WebFormDashboard.jsx:432, 433, 516`
- `WhatsAppDashboard.jsx:240`

Where these are read-only status pills they are exempt. Where they are clickable (filters, message
toggles), expand the hit area to ≥44px.

### 10.4 `surface-400` used for real text — MEDIUM

At 2.56:1 this fails §2.3 Rule A. **Violations** (real, readable text):

| Location | Text | Size |
|---|---|---|
| `index.js:135` | "Please provide as much detail as possible." | 12px |
| `index.js:147` | Privacy/Terms consent line | 12px |
| `index.js:163` | Footer container (`©` line + links) | 12px |
| `SupportForm.jsx:84` | Field hint (the character counter) | **11px** |
| `SupportForm.jsx:122` | "Ticket Reference" label | **10px** |
| `pages/ticket/[id].js:68` | Message bubble byline ("AI Support Agent • time") | 12px |
| `pages/ticket/[id].js:143` | Breadcrumb | 12px |
| `pages/ticket/[id].js:182, 190, 194, 201` | Ticket meta labels (ID, Channel, Created, Last Update) | 12px |
| `pages/ticket/[id].js:227` | "Your message has been received…" | 14px |
| `pages/ticket/[id].js:253` | Footer | 12px |

**Fix:** `surface-400` → `surface-500` on light surfaces. Re-verify at 12px, where the floor applies fully.
`SupportForm.jsx:84` and `:122` additionally violate the 12px minimum text size (§3) — 10px and 11px
lowercase are below the floor regardless of contrast.

**Correct uses of `surface-400` — do not change these:**
`index.js:54` (decorative channel icon, `aria-hidden`), `SupportForm.jsx:91` (`placeholder:text-surface-400`
— placeholders are exempt under Rule A), `SupportForm.jsx:312` (decorative chevron, `aria-hidden`),
`pages/ticket/[id].js:10, 50` (status dot, `aria-hidden`).

**Also in this family:** `pages/ticket/[id].js:68` puts `text-brand-200` on the `bg-brand-600` user
message bubble — the same 4.19:1 failure as §2.3 Rule B. This one is user-visible body copy; use
`brand-100`.

### 10.5 Hardcoded hex bypassing tokens — LOW

A full scan found **exactly six** hardcoded hex values in the entire app, all in
`WhatsAppDashboard.jsx`, and all of them legitimate third-party brand colors:

| Value | Count | What |
|---|---|---|
| `#075e54` | 3 | WhatsApp header green |
| `#25d366` | 2 | WhatsApp brand green |
| `#e5ddd5` | 1 | WhatsApp chat background |

This is better than the finding I expected to write. Third-party brand colors are a genuine token
exception — reproducing WhatsApp's chrome accurately requires its actual hex. The only ask: name them
once rather than repeating them inline.

```js
const WA = { header: '#075E54', brand: '#25D366', chatBg: '#E5DDD5' };  // third-party brand, fixed by spec
```

Note for the record: `brand`/`surface` token adoption across the app is otherwise **complete**. The
earlier draft of this document speculated about "raw hex scattered through components" — that was wrong,
and this is what the scan actually found.

### 10.6 Emoji as structural/glyph icons — MEDIUM

- `WhatsAppDashboard.jsx:155–157` — delivery ticks are `✓` / `✓✓` text characters used as status icons.
  They are font-dependent and render inconsistently across platforms. Replace with SVG (single check,
  double check), keeping the accessible label.
- `WhatsAppDashboard.jsx:110, 124` — 📞 📧 🚀 inside *message body copy*. Emoji in user-authored content
  is fine; this is AI-generated copy, so it's a product-copy decision, not an icon-discipline violation.
  Flagging so the distinction is explicit: **do not "fix" these as icons.**
- `WebFormDashboard.jsx:481, 485` — `⏳` returned as a journey-step *time value* (`'⏳'` in
  `journeyData`) and rendered inside a `text-xs` timestamp slot. This **is** a violation: it's a UI
  state, not content. Use the existing `IconClock`. (The `IconLoader`/spinner at line 643 is already
  SVG and is fine.)

### 10.7 Non-responsive stat and metric grids — MEDIUM

`grid-cols-4` / `grid-cols-3` are hardcoded with no breakpoint:

| Location | Grid |
|---|---|
| `WebFormDashboard.jsx:396` | `grid-cols-4` stat row |
| `WebFormDashboard.jsx:527` | `grid-cols-4` ticket metrics |
| `GmailDashboard.jsx:342` | `grid-cols-3` |
| `GmailDashboard.jsx:454` | `grid-cols-4` stat row |
| `WhatsAppDashboard.jsx:307` | `grid-cols-3` info footer |
| `WhatsAppDashboard.jsx:331` | `grid-cols-4` stat row |

At 375px each cell in a 4-up grid is ~80px wide and the labels wrap mid-word. Use
`grid-cols-2 sm:grid-cols-4` (and `gap-2 sm:gap-3`). The `grid-cols-2` at
`WebFormDashboard.jsx:582` and the already-responsive `grid-cols-1 sm:grid-cols-2` at
`SupportForm.jsx:257` show the target pattern is already understood in this codebase — it just wasn't
applied to the stat grids.

### 10.8 Miscellaneous

- `WebFormDashboard.jsx:377` — `text-surface-500` on the `surface-900` flow panel measures 3.75:1
  (large-text-only). Bump to `surface-400` (6.96:1) on dark panels. The step subtitles at line 374
  already use `surface-400` correctly.
- `WebFormDashboard.jsx:727` — `text-brand-200` on `bg-brand-600` = 4.19:1; use `brand-100` (4.83:1).
- `WebFormDashboard.jsx:622` — AI-response `<pre>` has no max text measure; cap at `65ch`.
- `WebFormDashboard.jsx:641` — raw `animate-spin` on a hand-rolled spinner div duplicates `IconLoader`.
- `GmailDashboard.jsx:454` vs `WebFormDashboard.jsx:396` — the stat-card markup is copy-pasted across
  three dashboards with divergent styling. Extract one `<StatGrid>` component.
- `WebFormDashboard.jsx` `TicketRow` is a `<button>` containing block content — correct, and it already
  handles `focus-visible:ring-inset`. This is the model the other dashboards should follow.
- `pages/ticket/[id].js:50` — the ticket status page uses `emerald`/`amber`/`blue`/`red` while the
  dashboards use `green`/`orange`/`blue`. Unify on §2.2.
- `chatbot.html:325` — `role="log" aria-live="polite"` on the message list is **correct** usage; keep it.

**Verified clean** — checked and found no issue, recorded so nobody re-audits them:

- Hardcoded hex: only six values app-wide, all legitimate third-party brand colors (§10.5).
- `prefers-reduced-motion`: correctly implemented in `globals.css` with a blanket `0.01ms !important`
  override across all animations and transitions.
- `:focus-visible` treatment: correctly split from `:focus`, 2px offset ring at `#7C3AED`, and mouse
  users get `outline: none` only via `:focus:not(:focus-visible)`.
- `TicketRow` (`WebFormDashboard.jsx:413`) — a real `<button>` with `focus-visible:ring-inset` and a
  4px left border as a non-color selection indicator. This is the reference implementation.
- `TicketDetail` tabs (`WebFormDashboard.jsx:554`) — complete ARIA tab contract (`tablist`/`tab`/
  `aria-selected`/`aria-controls`/`id`).
- `_app.js` — `next/font/google` with `display: 'swap'` and CSS variables; no layout shift on load.
- All icons are inline SVG with `aria-hidden="true"` on decorative instances; no icon font.

---

## 11. Anti-patterns

**Prohibited**
- Raw hex in components. Tokens only (except named third-party brand colors, §10.5).
- Emoji as a UI state or control icon.
- Color as the sole carrier of meaning.
- `role="status"` / `aria-live` on containers that re-render frequently.
- Removing focus rings.
- Hover-only affordances.
- Animating layout properties.
- Fixed-pixel grid columns without a responsive branch.
- Arbitrary Tailwind values (`text-[13px]`, `p-[7px]`) where a token exists.

**From the skill DB, apply with judgement**
- The tool's `--design-system` output recommends a landing-page section flow (hero → metrics →
  how-it-works → CTA). **Wrong surface.** The dashboards are authenticated consoles; the only place a
  landing pattern applies is `pages/index.js`, which already gets it right.
- "Avoid: Slow updates + No automation" — relevant as a *product* signal. The console shows Kafka →
  agent → SMTP → status precisely to demonstrate automation. Keep it, but per the pattern guidance:
  **label telemetry as live only when backed by a current source, and show the update time and stale
  state.** The headers currently claim "FastAPI Active" / "Twilio active" unconditionally with no data
  behind them. That is a trust defect, not just a design one.

---

## 12. Accessibility contract

Every component shipped against this system satisfies:

- [ ] Normal text ≥4.5:1; large text (≥24px, or ≥18.66px bold) ≥3:1 — verified, not eyeballed (§2.3)
- [ ] Non-text UI (borders, icons, control boundaries) ≥3:1
- [ ] `surface-400` carries no essential text
- [ ] Interactive targets ≥44×44px on touch, hit area expanded where the visual is smaller
- [ ] Keyboard: full traversal, logical order, visible focus, `Esc` dismisses overlays
- [ ] Tabs implement arrow-key navigation (§9.6)
- [ ] Forms: visible labels, inline errors via `aria-describedby` + `aria-invalid`, first error focused
- [ ] Multi-error forms focus a linked error summary after submit
- [ ] One atomic `role="status"` per view for async updates; no live region on re-rendering containers
- [ ] Decorative icons `aria-hidden="true"`; meaningful icons have a text alternative
- [ ] `prefers-reduced-motion` respected — final state rendered immediately
- [ ] Text zooms to 200% without loss of content or function
- [ ] Sticky UI does not obscure focused elements
- [ ] Dark/glass panels re-verified independently — light-mode values do not carry over

---

## 13. Responsive breakpoints

Mobile-first. Tailwind defaults, unchanged.

| Name | Min-width | Target behaviour |
|---|---|---|
| `base` | 0 | Single column. Split views collapse. Tables → card layout or `overflow-x-auto`. |
| `sm` | 640 | Form fields go 2-up. Stat grids go 4-up. |
| `md` | 768 | Nav labels appear. Filter rows stop scrolling. |
| `lg` | 1024 | Master–detail split activates. |
| `xl` | 1280 | Console max-width (`max-w-7xl`) reached. Content measure capped. |

Verify at **375 / 768 / 1024 / 1440**, plus landscape phone.

---

## 14. Pre-delivery checklist

**Process**
- [ ] Contrast re-measured on any new color pair (§2.3 method) — do not inherit these numbers
- [ ] Tested at 375px and in landscape
- [ ] Verified with `prefers-reduced-motion` enabled
- [ ] Verified at 200% text zoom
- [ ] Keyboard-only pass over every interactive element
- [ ] Screen-reader pass on any view with a live region
- [ ] All touch targets ≥44×44px

**Visual**
- [ ] No emoji as icons; SVG from one consistent family (currently Lucide-style, 2px stroke)
- [ ] Icons decorative → `aria-hidden`; meaningful → text alternative
- [ ] `cursor-pointer` on all clickables
- [ ] Hover transitions 150–300ms with `cubic-bezier(0.16, 1, 0.3, 1)`
- [ ] No layout shift on press/hover (transform/opacity only)
- [ ] Tokens used consistently; no ad-hoc hex

**Content**
- [ ] Every "live"/"active" indicator is backed by real data or is relabelled (§11)
- [ ] Timestamps present wherever a state could be stale
- [ ] No placeholder-only labels
