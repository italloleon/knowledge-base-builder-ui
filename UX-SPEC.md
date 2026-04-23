# Knowledge Base Builder UI — UX Specification

**Version**: 1.0  
**Date**: 2026-04-21  
**Target users**: Developers and administrators managing ENARE PDF ingestion and parse quality  
**Backend base URL**: `http://localhost:8000`  
**Audience for this document**: Frontend developer implementing the UI from scratch

---

## Table of Contents

1. [Product Context](#1-product-context)
2. [Information Architecture](#2-information-architecture)
3. [Layout System](#3-layout-system)
4. [Color Palette](#4-color-palette)
5. [Typography](#5-typography)
6. [Component Inventory](#6-component-inventory)
7. [Key Interaction Flows](#7-key-interaction-flows)
8. [Empty States and Loading States](#8-empty-states-and-loading-states)
9. [Confidence Score Visualization](#9-confidence-score-visualization)
10. [Question Type Badges](#10-question-type-badges)
11. [Section Labels](#11-section-labels)
12. [CSS Foundation](#12-css-foundation)
13. [Theme Toggle](#13-theme-toggle)

---

## 1. Product Context

This is an internal data quality dashboard, not a consumer product. The users are technical — they understand job queues, confidence scores, and parse errors. Design accordingly: information density is welcome, decorative chrome is not.

The primary workflow is:

1. Upload an ENARE exam PDF (or provide a URL)
2. Monitor the processing job until it completes
3. Review parsed questions, filtering by confidence, section, and type
4. Inspect parse errors to evaluate parser quality
5. Iterate until confidence scores and error counts are acceptable before introducing an LLM layer

The visual register is **clinical dashboard**: precise, readable, data-forward. Think PgAdmin or Grafana, not a marketing site.

---

## 2. Information Architecture

### 2.1 Route Hierarchy

```
/                         → redirect to /ingest
/ingest                   → Ingest page (upload + active jobs)
/jobs/:job_id             → Job detail / status polling page
/exams                    → Exam list
/exams/:id                → Exam detail (tabbed: Questions | Errors | Overview)
/exams/:id/questions      → Question list (default tab)
/exams/:id/errors         → Parse error list (tab)
/questions/:id            → Question detail (modal overlay, not a full page)
```

### 2.2 Navigation Structure

The app uses a **left sidebar** navigation (see Layout System). Nav items:

| Label | Icon | Route | Badge |
|-------|------|--------|-------|
| Ingest | Upload icon | `/ingest` | Count of active jobs (pending + processing) |
| Exams | Database icon | `/exams` | — |

The sidebar is narrow (56px collapsed / 200px expanded). The default state on desktop is expanded. Below 768px it collapses to icon-only.

A system health indicator sits at the bottom of the sidebar — a small dot (green/red) that reflects the `GET /health/ready` endpoint, polled every 30 seconds.

### 2.3 Page Hierarchy Summary

```
Sidebar
├── Ingest
│   ├── Upload zone (file drag-drop or URL input)
│   └── Active jobs panel (polling list, auto-refreshes)
├── Exams
│   ├── Exam list (cards or table)
│   └── Exam detail
│       ├── Tab: Overview (stats summary)
│       ├── Tab: Questions (filterable table + question detail modal)
│       └── Tab: Errors (parse error list)
└── [Global] Job detail page (navigated from active jobs or job ID links)
```

---

## 3. Layout System

### 3.1 Sidebar + Main Content

```
┌──────────────┬────────────────────────────────────────────┐
│   Sidebar    │                  Main content              │
│   200px      │        flex: 1, min-width: 0              │
│   (fixed)    │        overflow-y: auto                   │
└──────────────┴────────────────────────────────────────────┘
```

The sidebar is `position: fixed`, full viewport height. Main content has `margin-left: 200px` (or 56px when collapsed) and fills the remaining width.

On mobile (< 768px): sidebar becomes an off-canvas drawer triggered by a hamburger button in a top bar. The top bar is 48px tall, full width.

### 3.2 Content Container

```css
.content-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}
```

Most pages do not need a content container — the main area already has padding. Only use max-width on pages where content is prose-heavy (question detail).

### 3.3 Grid Patterns

**Stats row (Exam Overview / Job detail)**:
```css
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-4);
}
```

**Two-panel layout (question list + filter sidebar)**:
```css
.panel-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: var(--space-6);
  align-items: start;
}
@media (max-width: 900px) {
  .panel-layout {
    grid-template-columns: 1fr;
  }
}
```

**Card grid (Exam list)**:
```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-5);
}
```

### 3.4 Spacing Scale

Based on a 4px base unit. Use CSS custom properties:

| Token | Value | Pixels |
|-------|-------|--------|
| `--space-1` | 0.25rem | 4px |
| `--space-2` | 0.5rem | 8px |
| `--space-3` | 0.75rem | 12px |
| `--space-4` | 1rem | 16px |
| `--space-5` | 1.25rem | 20px |
| `--space-6` | 1.5rem | 24px |
| `--space-8` | 2rem | 32px |
| `--space-10` | 2.5rem | 40px |
| `--space-12` | 3rem | 48px |
| `--space-16` | 4rem | 64px |

### 3.5 Elevation / Shadow Scale

```css
--shadow-sm:  0 1px 2px 0 rgb(0 0 0 / 0.06);
--shadow-md:  0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05);
--shadow-lg:  0 10px 15px -3px rgb(0 0 0 / 0.10), 0 4px 6px -4px rgb(0 0 0 / 0.06);
--shadow-modal: 0 20px 60px -10px rgb(0 0 0 / 0.25);
```

### 3.6 Border Radius

```css
--radius-sm:  4px;
--radius-md:  6px;
--radius-lg:  8px;
--radius-xl:  12px;
--radius-full: 9999px;
```

---

## 4. Color Palette

### 4.1 Design Philosophy

Clinical/professional. The palette is desaturated with accent color used sparingly. Data states (success, warning, error, info) are drawn from established convention — green/yellow/red/blue — but at controlled saturation. No gradients. No decorative color.

### 4.2 Primary Brand Color — Slate Blue

Used for interactive elements (links, primary buttons, active nav states, focus rings).

| Token | Hex | Usage |
|-------|-----|-------|
| `--primary-50` | `#f0f4ff` | Hover backgrounds |
| `--primary-100` | `#dce6ff` | Selected row backgrounds |
| `--primary-200` | `#b9cdff` | — |
| `--primary-500` | `#3b5bdb` | Primary buttons, active states |
| `--primary-600` | `#2f4ac7` | Button hover |
| `--primary-700` | `#2540b0` | Button active/pressed |
| `--primary-900` | `#1a2f80` | — |

### 4.3 Neutral Scale — Cool Gray

| Token | Hex | Light theme usage | Dark theme usage |
|-------|-----|-------------------|-----------------|
| `--neutral-0` | `#ffffff` | Page background | — |
| `--neutral-50` | `#f8f9fa` | Sidebar bg, alt row | Page background |
| `--neutral-100` | `#f1f3f5` | Input backgrounds, table header | Sidebar bg |
| `--neutral-200` | `#e9ecef` | Borders, dividers | Elevated surface borders |
| `--neutral-300` | `#dee2e6` | Disabled borders | — |
| `--neutral-400` | `#ced4da` | Placeholder text | — |
| `--neutral-500` | `#adb5bd` | Muted icons | Muted text |
| `--neutral-600` | `#868e96` | Secondary text | — |
| `--neutral-700` | `#495057` | Body text (dark theme) | Secondary text |
| `--neutral-800` | `#343a40` | Headings (dark theme) | Body text |
| `--neutral-900` | `#212529` | Body text (light) | Headings |
| `--neutral-950` | `#0d0f12` | — | Page background |

### 4.4 Semantic Colors

**Success — Green**  
Used for `completed` job status, high confidence scores.

| Token | Hex |
|-------|-----|
| `--success-50` | `#ebfbee` |
| `--success-100` | `#d3f9d8` |
| `--success-500` | `#2f9e44` |
| `--success-600` | `#2b8a3e` |
| `--success-700` | `#237032` |

**Warning — Amber**  
Used for `partial` status, medium confidence scores, unknown question types.

| Token | Hex |
|-------|-----|
| `--warning-50` | `#fff9db` |
| `--warning-100` | `#fff3bf` |
| `--warning-500` | `#f59f00` |
| `--warning-600` | `#e67700` |
| `--warning-700` | `#b35900` |

**Error — Red**  
Used for `failed` status, low confidence scores, parse errors.

| Token | Hex |
|-------|-----|
| `--error-50` | `#fff5f5` |
| `--error-100` | `#ffe3e3` |
| `--error-500` | `#e03131` |
| `--error-600` | `#c92a2a` |
| `--error-700` | `#a61e1e` |

**Info — Teal**  
Used for `processing` / `pending` status, informational callouts.

| Token | Hex |
|-------|-----|
| `--info-50` | `#e6fcf5` |
| `--info-100` | `#c3fae8` |
| `--info-500` | `#0ca678` |
| `--info-600` | `#099268` |
| `--info-700` | `#087f5b` |

### 4.5 Semantic Surface Tokens

These are the tokens the UI actually consumes — they point to palette values and flip in dark mode:

```css
/* Light theme (default) */
:root {
  --bg-page:        var(--neutral-0);
  --bg-surface:     var(--neutral-0);
  --bg-surface-alt: var(--neutral-50);
  --bg-sidebar:     var(--neutral-50);
  --bg-input:       var(--neutral-100);

  --border-subtle:  var(--neutral-200);
  --border-default: var(--neutral-300);
  --border-strong:  var(--neutral-400);

  --text-primary:   var(--neutral-900);
  --text-secondary: var(--neutral-600);
  --text-muted:     var(--neutral-500);
  --text-disabled:  var(--neutral-400);
  --text-on-primary: #ffffff;

  --focus-ring:     var(--primary-500);
}

/* Dark theme */
[data-theme="dark"] {
  --bg-page:        var(--neutral-950);
  --bg-surface:     #1a1d23;
  --bg-surface-alt: var(--neutral-50);  /* maps to #f8f9fa — kept for reference */
  --bg-sidebar:     #13151a;
  --bg-input:       #21242b;

  --border-subtle:  #2a2d35;
  --border-default: #363940;
  --border-strong:  #4a4e57;

  --text-primary:   var(--neutral-100);
  --text-secondary: var(--neutral-500);
  --text-muted:     var(--neutral-600);
  --text-disabled:  var(--neutral-700);
  --text-on-primary: #ffffff;

  --focus-ring:     var(--primary-200);
}
```

---

## 5. Typography

### 5.1 Font Stack

```css
--font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont,
             'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

--font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code',
             'Roboto Mono', Menlo, Consolas, monospace;
```

The monospace font is used exclusively for: `raw_block` text, file hashes, UUIDs, and code snippets. Do not use it for data labels.

Load Inter from Google Fonts: `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap`

### 5.2 Type Scale

| Token | rem | px | Weight | Line-height | Usage |
|-------|-----|----|--------|-------------|-------|
| `--text-xs` | 0.6875rem | 11px | 500 | 1.4 | Table metadata, timestamps, file hashes |
| `--text-sm` | 0.8125rem | 13px | 400 | 1.5 | Table body, secondary labels, badge text |
| `--text-base` | 0.9375rem | 15px | 400 | 1.6 | Body copy, question stems |
| `--text-md` | 1rem | 16px | 500 | 1.5 | Card titles, section headings |
| `--text-lg` | 1.125rem | 18px | 600 | 1.4 | Page section headings (H2) |
| `--text-xl` | 1.375rem | 22px | 700 | 1.3 | Page title (H1) |
| `--text-2xl` | 1.75rem | 28px | 700 | 1.2 | Stat numbers |

### 5.3 Weight Decisions

- **400 (Regular)**: Body text, table rows, question stems
- **500 (Medium)**: Labels, nav items, badge text, card metadata
- **600 (Semibold)**: Table column headers, section headings, button labels
- **700 (Bold)**: Page titles, stat numbers, question number

### 5.4 Heading Element Map

| Element | Size token | Usage |
|---------|-----------|-------|
| `h1` | `--text-xl` 700 | One per page, page title |
| `h2` | `--text-lg` 600 | Section headings within a page |
| `h3` | `--text-md` 600 | Card headings, modal section labels |
| `h4` | `--text-base` 600 | Sub-section labels |

### 5.5 Monospace Usage

```css
.raw-block {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: 1.7;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--text-primary);
}

.uuid-display {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.file-hash {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-muted);
  /* Truncate at 12 chars with tooltip for full hash */
}
```

---

## 6. Component Inventory

Listed in dependency order — build base components first.

### 6.1 Base Tokens (not components, just CSS variables)
All tokens defined in Section 4 and 5. Applied to `:root` and `[data-theme="dark"]`.

### 6.2 Badge

Used for: job status, question type, section label, confidence tier. Four visual variants:

```
Anatomy:   [dot?] [label]
Height:    20px
Padding:   2px 8px
Radius:    --radius-full
Font:      --text-xs, weight 500, uppercase tracking: 0.04em
```

Variants: `success | warning | error | info | neutral | primary`

Each variant has: background (tinted), text color (dark shade of same hue), optional left-aligned colored dot (6px circle).

### 6.3 Button

Three sizes: `sm` (28px height), `md` (36px), `lg` (44px).  
Four variants: `primary | secondary | ghost | danger`.

```
Primary:   bg --primary-500, text white, hover --primary-600
Secondary: bg transparent, border --border-default, text --text-primary,
           hover bg --bg-surface-alt
Ghost:     bg transparent, no border, text --text-secondary,
           hover text --text-primary, hover bg --bg-surface-alt
Danger:    bg --error-500, text white, hover --error-600
```

All buttons: `border-radius: var(--radius-md)`, `font-weight: 600`, `transition: background 120ms ease`.

Focus state: `outline: 2px solid var(--focus-ring); outline-offset: 2px`.

Disabled state: `opacity: 0.45; cursor: not-allowed`.

Loading state: replace label with a 16px spinner + "Loading…" text. Disable pointer events.

### 6.4 Input / Textarea

```
Height (input): 36px
Border:         1px solid var(--border-default)
Radius:         var(--radius-md)
Bg:             var(--bg-input)
Padding:        0 var(--space-3)
Font:           --text-sm, --font-sans
Focus:          border-color var(--primary-500), box-shadow: 0 0 0 3px rgb(59 91 219 / 0.15)
Error state:    border-color var(--error-500)
```

Textarea inherits input styles. Used for URL input on the Ingest page.

### 6.5 Select / Dropdown

Native `<select>` styled to match Input. Custom arrow icon via `background-image`. No JavaScript custom dropdown — this is a dev tool, native is acceptable.

### 6.6 Card

Surface element. Used for: Exam cards, stat tiles, upload zone container.

```css
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}
.card:hover {  /* only on clickable cards */
  border-color: var(--border-default);
  box-shadow: var(--shadow-md);
  transition: all 150ms ease;
}
```

### 6.7 Stat Tile

A specific Card variant used in the Job detail and Exam overview stat row.

```
Anatomy:
  ┌─────────────────────────┐
  │  Label (--text-xs, muted)│
  │  Value (--text-2xl, bold)│
  │  [Optional delta / note] │
  └─────────────────────────┘
```

For parse stats specifically, show:
- Total Found
- Parsed OK (green value if = total, amber if partial)
- Parse Errors (neutral if 0, red if > 0)
- Success Rate % (derived: `parsed_ok / total_found * 100`, color-coded)

### 6.8 Progress Bar

Horizontal bar used in: Job status card (parse progress), Confidence distribution chart.

```css
.progress-bar-track {
  height: 6px;
  background: var(--bg-surface-alt);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 400ms ease;
  background: var(--primary-500); /* or semantic color based on value */
}
```

### 6.9 Spinner

A CSS-only circular spinner. Two sizes: 16px (inline/button) and 32px (page-level).

```css
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-default);
  border-top-color: var(--primary-500);
  border-radius: 50%;
  animation: spin 600ms linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
```

### 6.10 Upload Zone

A large dashed-border drop target on the Ingest page.

```
State: idle
  - Dashed border: 2px dashed --border-default
  - Bg: --bg-surface-alt
  - Center: Upload icon (32px) + "Drag a PDF here, or click to browse" label
  - Below: "or" separator + URL input alternative

State: drag-over
  - Dashed border: 2px dashed --primary-500
  - Bg: --primary-50 (light) / dark equivalent
  - Label: "Drop to upload"

State: uploading
  - Replace content with Spinner + "Uploading…" + filename

State: error
  - Border: --error-500
  - Show error message below the zone
```

Only accept `.pdf` files. The `accept` attribute on the hidden `<input type="file">` must be `application/pdf,.pdf`.

### 6.11 Job Status Card

Used in the Active Jobs panel on the Ingest page and as a standalone Job detail page.

```
Anatomy:
  ┌─────────────────────────────────────────┐
  │ [Status Badge]  Job ID (truncated mono) │
  │ Exam: filename                          │
  │ Created: relative timestamp             │
  ├─────────────────────────────────────────┤
  │ [Progress Bar — parsed_ok / total_found]│
  │  X / Y questions  •  Z errors           │
  │ [Error message if failed]               │
  └─────────────────────────────────────────┘
```

Progress bar color:
- Processing / Pending: `--primary-500`
- Completed: `--success-500`
- Partial: `--warning-500`
- Failed: `--error-500`

### 6.12 Table

Used for: Question list, Parse error list.

```
Row height:    48px (question rows), 40px (error rows)
Header:        bg --bg-surface-alt, font-weight 600, --text-sm, sticky top
Body row:      border-bottom 1px solid --border-subtle
Hover row:     bg --bg-surface-alt
Selected row:  bg --primary-100 (light) / #1e2540 (dark)
```

Columns must support: sort indicator (up/down chevron, inactive = muted), overflow ellipsis with tooltip.

### 6.13 Pagination

```
Anatomy:   [Prev]  [1] [2] ... [N]  [Next]   Page X of Y   (right-aligned: "per page" select)
```

Buttons: ghost variant, active page gets `--primary-500` background. Per-page options: 20, 50, 100.

### 6.14 Filter Panel

Left sidebar panel on the Exam Questions view.

```
Sections:
  - Section (radio: All | Conhecimentos Gerais | Conhecimentos Específicos)
  - Type (checkboxes: simple | roman_numeral | true_false | association | unknown)
  - Min confidence (range slider: 0.0–1.0, step 0.05; display current value inline)

Actions:
  - "Apply filters" button (primary sm)
  - "Clear" link (ghost sm)
```

Active filter count shown as a badge on the "Filters" button when the panel is collapsed on mobile.

### 6.15 Question Detail Modal

Full-screen-height overlay on the right side (drawer pattern), not center modal.

```
Width:     560px (desktop), full-width (mobile)
Animation: slide in from right, 200ms ease
Backdrop:  rgba(0,0,0,0.4)

Anatomy (top to bottom):
  Header:
    [Q. {number}]  [Section badge]  [Type badge]
    [Confidence score + bar]
    [Close button ×]

  Body (scrollable):
    Enunciado (question stem)
    Items (if roman_numeral or true_false):
      Rendered as a clean list (I. … | II. … | V/F indicator)
    Alternatives A–E:
      Monospace-adjacent rendering, each on its own row
      [Gabarito indicator if populated — "Correct: C"]
    
    Raw Block section (collapsed by default, expandable):
      <details><summary>Raw block</summary>
        <pre class="raw-block">…</pre>
      </details>

  Footer:
    [← Prev question]   [Next question →]
    [Link: Open full page]
```

### 6.16 Parse Error Card

Used in the Exam Errors tab.

```
Anatomy:
  ┌──────────────────────────────────────────┐
  │  Reason: [reason text]                   │
  │  Created: [timestamp]                    │
  ├──────────────────────────────────────────┤
  │  Raw block (collapsible, --raw-block)    │
  └──────────────────────────────────────────┘
```

Error cards are listed vertically without a table. The `reason` text is the primary visible content — it is what tells the developer why parsing failed.

### 6.17 Tabs

Used on the Exam detail page.

```
Anatomy:   [Overview] [Questions (N)] [Errors (N)]
Style:     underline variant — active tab has 2px bottom border in --primary-500,
           active text in --text-primary weight 600;
           inactive in --text-secondary weight 400
Height:    40px per tab
```

The count badge within the tab label uses `--text-xs` weight 500 in `--text-muted`, e.g. "Questions (87)".

### 6.18 Toast Notifications

Positioned: top-right, 16px from edges. Stack vertically with 8px gap.

```
Width:      360px max
Duration:   4 seconds auto-dismiss (error toasts: 8 seconds, no auto-dismiss)
Variants:   success | warning | error | info
```

Used for: upload success (with job ID and link), upload error, unexpected API failures.

### 6.19 Empty State

Centered in its container (see Section 8 for per-view specs).

```
Anatomy:
  [Icon — 40px, --text-muted]
  [Heading — --text-md, --text-secondary]
  [Body — --text-sm, --text-muted, max-width 320px]
  [Optional CTA button]
```

### 6.20 Skeleton Loader

Used during initial data fetch for tables and card grids (not during background polling).

Animated shimmer via CSS:

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-surface-alt) 25%,
    var(--border-subtle) 50%,
    var(--bg-surface-alt) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s ease infinite;
  border-radius: var(--radius-sm);
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### 6.21 Health Indicator (Sidebar Footer)

```
Anatomy:  [Colored dot 8px]  [Label text]
States:
  Healthy:     --success-500 dot, "API ready"
  Degraded:    --warning-500 dot, "Degraded"
  Unreachable: --error-500 dot, "Offline"
  Checking:    --neutral-400 dot (pulsing), "Checking…"
```

Tooltip on hover shows: `database: ok | redis: ok` (or error details from `/health/ready`).

### 6.22 Theme Toggle

Three-way toggle in the sidebar footer, above the health indicator.

```
Options:  Light | Dark | System
Style:    Pill-shaped segmented control, 24px height, icon-only or icon+label
          Active segment: bg --primary-500, text white
          Inactive: bg transparent, text --text-muted
```

See Section 13 for full implementation spec.

### 6.23 Confidence Distribution Chart

Horizontal stacked bar used in the Exam Overview tab.

```
Anatomy:
  High (≥0.9)    [████████████████████] 82%
  Medium (0.7–0.89) [████] 14%
  Low (<0.7)     [██] 4%

Each row: colored bar (width proportional to %) + percentage label
Colors: High=--success-500, Medium=--warning-500, Low=--error-500
```

No JavaScript charting library needed — this is pure CSS grid/flexbox.

---

## 7. Key Interaction Flows

### 7.1 Upload Flow

**Starting point**: `/ingest` page

**Step 1 — File selection**  
User drags a PDF onto the upload zone or clicks to open the file picker.  
Only `.pdf` files are accepted. If a non-PDF is dropped: show `--error-500` border on the upload zone + inline error text "Only PDF files are accepted." Do not call the API.

**Step 2 — Upload request**  
`POST /ingest/upload` with `multipart/form-data`, field name `file`.  
While the request is in flight:
- Upload zone shows Spinner + "Uploading {filename}…"
- Upload button is disabled

**Step 3 — Response handling**  
On success `{job_id, exam_id}`:
- Show success toast: "Upload complete. Job {job_id_short} created." with a link to `/jobs/{job_id}`
- Reset upload zone to idle state
- Immediately append the new job to the Active Jobs panel (optimistically, before polling response)

On error (4xx/5xx):
- Show error toast with the API error message
- Reset upload zone to idle (do not clear the filename — allow retry)

**Step 4 — Job tracking**  
The new job card appears in the Active Jobs panel. See 7.2.

---

**URL ingestion alternative**  
Below the upload zone there is a URL input (placeholder: "https://…/exam.pdf") and a "Fetch PDF" button (secondary).  
On click: `POST /ingest/url` with `{"url": "…"}`.  
Same response handling as Step 3.

---

### 7.2 Job Polling Flow

**Location**: Active Jobs panel on `/ingest`, and `/jobs/:job_id` standalone page

**Polling interval**: 3 seconds while job status is `pending` or `processing`.  
Stop polling when status becomes `completed`, `failed`, or `partial`.  
Use `setInterval` or `setTimeout` chaining. Clear the interval on component unmount.

**Visual updates during polling**:
- Progress bar width updates from `parsed_ok / total_found` (show 0% while `total_found === 0`)
- Counters update inline (no flash/re-render of the whole card)
- Status badge transitions: `pending` → `processing` → terminal state
- When completed/partial: append a link "View exam →" pointing to `/exams/{exam_id}`

**Terminal state behavior**:
- `completed`: green status badge, full progress bar, "View exam" link
- `partial`: amber badge, partial bar, error count visible, "View exam" link + "Review errors" link
- `failed`: red badge, error message displayed in the card, no exam link (exam_id may be null)

**Active Jobs panel behavior**:
- Show only jobs where status is `pending` or `processing`. Terminal jobs are removed from this panel after a 5-second delay (so the user sees the final state before it disappears).
- If there are no active jobs: show the "No active jobs" empty state.
- Maximum visible: 5 jobs. If more, show "View all" link (not scoped in v1, can be deferred).

---

### 7.3 Exam List Flow

**Route**: `/exams`

`GET /exams` on mount. Render as a card grid.

Each card shows:
- Filename (truncated at 40 chars, full name in `title` attribute)
- Question count (prominent)
- File hash (first 12 chars, monospace, muted)
- Created date (relative: "3 days ago")
- CTA: "Review →" button (ghost)

Clicking anywhere on the card navigates to `/exams/{id}`.

---

### 7.4 Exam Detail Flow

**Route**: `/exams/:id` — defaults to the Questions tab

**On mount**: `GET /exams/{id}/questions?page=1&page_size=20`

**Tab navigation**: clicking a tab updates the URL hash (`#questions`, `#errors`, `#overview`) and fetches the relevant data if not yet loaded.

**Questions tab (default)**:
1. Render filter panel on the left, question table on the right
2. Table columns: `#`, `Type` (badge), `Section` (badge), `Confidence` (bar + value), `Enunciado` (truncated, ~80 chars), `Gabarito` (letter or "—")
3. Clicking a table row opens the Question Detail modal (7.5)
4. Filter changes trigger `GET /exams/{id}/questions` with updated query params: `section=`, `type=` (can be multi-value), `min_confidence=`
5. Filters are reflected in the URL as query params for shareability

**Errors tab**:
1. `GET /exams/{id}/errors` on tab activation
2. Render as a vertical list of Parse Error Cards
3. No pagination in v1 — render all (parse errors are typically < 20 per exam)

**Overview tab**:
1. Derived from the questions data already loaded:
   - Stat tiles: total questions, by section counts, by type counts
   - Confidence distribution chart (6.23)
   - File info: filename, hash, created date
2. No additional API call needed if questions were already fetched

---

### 7.5 Question Review Flow

**Triggered by**: clicking a row in the Questions table

**Modal opens** (drawer from right):
1. Display full question data from the row that was already fetched
2. If `raw_block` is not available (it is only in `QuestionDetail`, not `QuestionSummary`), fetch `GET /questions/{id}` to get the raw block. Show a spinner in the raw block section while loading.
3. Prev/Next navigation cycles through the currently visible (filtered) question list — uses the client-side list, no additional API call.

**Closing the modal**: Escape key, clicking the backdrop, or the × button. URL does not change (no deep-link for modal in v1).

---

### 7.6 Error Review Flow

**Route**: `/exams/:id#errors`

Parse Error Cards are listed vertically. Each card has:
- Reason text (the primary information — what failed and why)
- Timestamp
- Raw block (collapsed `<details>`, expanded on click)

The raw block shows exactly what text the parser received and could not structure. This is the main debugging surface.

There are no actions in v1 — this is read-only. The developer manually inspects errors to improve the parser.

---

## 8. Empty States and Loading States

Define these for every main view. Never show a blank page.

### 8.1 Ingest Page

| State | Display |
|-------|---------|
| Loading (initial) | No skeleton — the upload zone renders immediately. Active Jobs panel shows 1–2 skeleton cards. |
| No active jobs | Icon: clock/queue (outline). Heading: "No active jobs". Body: "Upload a PDF or submit a URL to start processing." No CTA (the upload zone above is already the CTA). |
| API unreachable | Show a banner above the upload zone: "Cannot reach the API. Check that the service is running at localhost:8000." Banner variant: error (--error-50 bg, --error-500 border, --error-700 text). |

### 8.2 Exam List

| State | Display |
|-------|---------|
| Loading | 4 skeleton cards in the card grid (matching card dimensions) |
| No exams yet | Icon: folder-open (outline). Heading: "No exams yet". Body: "Upload a PDF on the Ingest page to create the first exam." CTA: "Go to Ingest" (primary button → `/ingest`) |
| API error | Error card centered: "Failed to load exams." + error message + "Retry" button |

### 8.3 Exam Questions Tab

| State | Display |
|-------|---------|
| Loading | Skeleton table: 1 header row + 8 skeleton data rows |
| No questions (exam exists but 0 questions) | Icon: file-x (outline). Heading: "No questions parsed". Body: "The parser found no questions in this exam. Review the parse errors for details." CTA: "View errors" (→ errors tab). |
| No results matching filters | Icon: filter (outline). Heading: "No questions match these filters". Body: "Try relaxing the confidence threshold or removing type filters." CTA: "Clear filters" (clears all filter state). |

### 8.4 Exam Errors Tab

| State | Display |
|-------|---------|
| Loading | 3 skeleton cards (matching error card height) |
| No errors | Icon: check-circle (success green). Heading: "No parse errors". Body: "All blocks in this exam were parsed successfully." (This is a positive outcome — use green icon and green heading color.) |
| API error | Error card centered: "Failed to load errors." + "Retry" button |

### 8.5 Exam Overview Tab

| State | Display |
|-------|---------|
| Loading | Skeleton stat tiles + skeleton distribution bars |
| Data loads from already-fetched questions | Immediate render, no loading state needed |

### 8.6 Job Detail Page

| State | Display |
|-------|---------|
| Loading | Skeleton of a single Job Status Card |
| Job not found (404) | Icon: search (outline). Heading: "Job not found". Body: "No job exists with this ID. It may have been deleted." CTA: "Back to Ingest" |
| Polling active | Job card renders normally; status badge pulses subtly (CSS animation: opacity 1.0 → 0.6 → 1.0, 2s loop) while `pending` or `processing` |

---

## 9. Confidence Score Visualization

Confidence scores range from 0.0 to 1.0, where higher = the parser is more certain the block was structured correctly.

### 9.1 Confidence Tiers

| Tier | Range | Color | Label |
|------|-------|-------|-------|
| High | 0.90 – 1.00 | `--success-500` `#2f9e44` | "High" |
| Medium | 0.70 – 0.89 | `--warning-500` `#f59f00` | "Medium" |
| Low | 0.00 – 0.69 | `--error-500` `#e03131` | "Low" |

### 9.2 In-table Representation (Questions Table)

Each row displays confidence as a **paired element**: a narrow progress bar (80px wide, 4px height) followed by the numeric value.

```
[████████░░] 0.82
```

The bar fill color follows the tier color. The numeric value is `--text-sm`, monospace-adjacent (normal font is fine since it's always 4 chars like `0.82`), colored to match the tier.

```css
.confidence-cell {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.confidence-bar-track {
  width: 64px;
  height: 4px;
  background: var(--border-subtle);
  border-radius: var(--radius-full);
  flex-shrink: 0;
}
.confidence-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
}
/* Color class applied via JS based on tier */
.confidence-high  { background: var(--success-500); color: var(--success-600); }
.confidence-med   { background: var(--warning-500); color: var(--warning-700); }
.confidence-low   { background: var(--error-500);   color: var(--error-600); }
```

### 9.3 In-modal Representation (Question Detail)

A wider bar (full modal width minus padding, 8px height) with the score and tier badge displayed to the right.

```
Confidence  [████████████████████░░░░] 0.82  [Medium ●]
```

The tier badge is a colored dot + label, no border, no background — just color context.

### 9.4 In filter panel (Min Confidence Slider)

Range slider from 0.0 to 1.0. The track fills from left to the thumb position using the appropriate tier color (changes dynamically as value crosses thresholds).

Display current value inline next to the label: "Min confidence: 0.70"

Below the slider, a hint updates based on value:
- ≥ 0.90: "Showing only high-confidence questions"
- 0.70 – 0.89: "Showing medium and high confidence"
- < 0.70: "Showing all questions including low confidence"

### 9.5 In distribution chart (Exam Overview)

Three horizontal bars with percentage and count labels. See component 6.23.

---

## 10. Question Type Badges

Question type is determined by the parser and reflects structural features of the question block.

### 10.1 Visual Treatment

Badges use the Badge component (6.2). Each type gets a fixed color pair (background + text). The label is the human-readable display name, not the raw enum value.

| Enum value | Display label | Background | Text color | Dot color |
|------------|--------------|------------|------------|-----------|
| `simple` | Simple | `#f1f3f5` (neutral-100) | `#495057` (neutral-700) | `#adb5bd` (neutral-500) |
| `roman_numeral` | Roman Numeral | `#e7f5ff` | `#1864ab` | `#1971c2` |
| `true_false` | True / False | `#f3f0ff` | `#5f3dc4` | `#7048e8` |
| `association` | Association | `#fff0f6` | `#a61e4d` | `#c2255c` |
| `unknown` | Unknown | `#fff9db` | `#5c3d00` | `#f59f00` |

The `unknown` type uses the warning palette because it flags a question the parser could not confidently classify — it warrants human attention.

Dark mode: lighten the background by ~20% opacity. The `--success/warning/error` semantic palette provides the right dark-mode equivalents for known colors; for the custom type colors, define explicit dark-mode overrides in `[data-theme="dark"]`.

### 10.2 In the Questions Table

Badge displayed in a dedicated "Type" column (80px min-width). The badge is the full-width of the column cell content area.

### 10.3 In the Question Detail Modal

Type badge sits in the header row next to the section badge.

### 10.4 In Filter Panel

Checkboxes with the badge rendered next to each label (not just text). This gives visual confirmation of the type while filtering.

```html
<label class="filter-option">
  <input type="checkbox" value="roman_numeral">
  <span class="badge badge--roman-numeral">Roman Numeral</span>
</label>
```

---

## 11. Section Labels

Questions belong to one of three section values from `SectionType`:

| Enum value | Display label | Visual treatment |
|------------|--------------|-----------------|
| `conhecimentos_gerais` | Conhecimentos Gerais | Badge: neutral background (`--neutral-100`), text `--neutral-700` |
| `conhecimentos_especificos` | Conhecimentos Específicos | Badge: `--primary-50` background, text `--primary-700` |
| `unknown` | Unknown section | Badge: warning amber — `--warning-50` background, `--warning-700` text |

### 11.1 Display Rules

- In the Questions table: a "Section" column shows the badge. The full Portuguese label is always displayed, never abbreviated. The badge must be wide enough to fit "Conhecimentos Específicos" without truncation at the default table width. At minimum: `min-width: 180px` for this column.
- In the Question Detail modal: section badge sits next to type badge in the header.
- In filter panel: radio buttons (not checkboxes — a question belongs to exactly one section).

### 11.2 Section Stats in Exam Overview

Show a breakdown in the Overview tab:

```
Conhecimentos Gerais       47  ████████████████████  54%
Conhecimentos Específicos  38  ████████████████      43%
Unknown                     2  █                      2%
```

The distribution bar color follows the section badge color (neutral for Gerais, primary-500 for Específicos, warning for Unknown).

---

## 12. CSS Foundation

### 12.1 File Structure

```
knowledge-base-builder-ui/
├── src/
│   ├── styles/
│   │   ├── tokens.css        ← all CSS custom properties (:root, dark theme)
│   │   ├── reset.css         ← minimal reset (box-sizing, margin, font)
│   │   ├── base.css          ← html/body/typography base styles
│   │   ├── layout.css        ← sidebar, content area, grid patterns
│   │   ├── components.css    ← all component styles
│   │   └── utilities.css     ← helper classes (sr-only, truncate, etc.)
│   └── main.css              ← imports all of the above in order
```

### 12.2 Reset

```css
/* reset.css */
*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; padding: 0; }
html { -webkit-text-size-adjust: 100%; }
img, video, svg { display: block; max-width: 100%; }
input, button, textarea, select { font: inherit; }
p, h1, h2, h3, h4 { overflow-wrap: break-word; }
```

### 12.3 Base Body

```css
/* base.css */
html {
  font-size: 16px;
  line-height: 1.5;
}
body {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--text-primary);
  background-color: var(--bg-page);
  transition: background-color 0.25s ease, color 0.25s ease;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### 12.4 Utilities

```css
/* utilities.css */
.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0,0,0,0); white-space: nowrap; border-width: 0;
}
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mono {
  font-family: var(--font-mono);
}
.text-muted { color: var(--text-muted); }
.text-secondary { color: var(--text-secondary); }
.text-success { color: var(--success-600); }
.text-warning { color: var(--warning-600); }
.text-error   { color: var(--error-600); }
```

---

## 13. Theme Toggle

### 13.1 Behavior

Three states: `light`, `dark`, `system`.  
`system` reads `window.matchMedia('(prefers-color-scheme: dark)')`.  
Preference is persisted in `localStorage` under key `kbb-theme`.  
Applied by setting `data-theme="light"` or `data-theme="dark"` on `<html>`. For `system`, remove the attribute and let the `@media` query take over.

### 13.2 HTML

```html
<!-- Place in sidebar footer -->
<div class="theme-toggle" role="radiogroup" aria-label="Color theme">
  <button class="theme-toggle-btn" data-theme="light" aria-label="Light theme">
    <!-- sun icon SVG, 14px -->
  </button>
  <button class="theme-toggle-btn" data-theme="system" aria-label="System theme">
    <!-- monitor icon SVG, 14px -->
  </button>
  <button class="theme-toggle-btn" data-theme="dark" aria-label="Dark theme">
    <!-- moon icon SVG, 14px -->
  </button>
</div>
```

### 13.3 CSS

```css
.theme-toggle {
  display: inline-flex;
  background: var(--bg-input);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-full);
  padding: 2px;
  gap: 2px;
}
.theme-toggle-btn {
  width: 28px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: var(--radius-full);
  color: var(--text-muted);
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;
}
.theme-toggle-btn:hover {
  color: var(--text-primary);
}
.theme-toggle-btn[aria-pressed="true"] {
  background: var(--primary-500);
  color: var(--text-on-primary);
}
```

### 13.4 JavaScript

```javascript
// theme-manager.js
(function () {
  const STORAGE_KEY = 'kbb-theme';
  const THEMES = ['light', 'system', 'dark'];

  function getStored() {
    return localStorage.getItem(STORAGE_KEY) || 'system';
  }

  function apply(theme) {
    const html = document.documentElement;
    if (theme === 'system') {
      html.removeAttribute('data-theme');
    } else {
      html.setAttribute('data-theme', theme);
    }
    localStorage.setItem(STORAGE_KEY, theme);
    updateButtons(theme);
  }

  function updateButtons(active) {
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
      const isActive = btn.dataset.theme === active;
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }

  function init() {
    const stored = getStored();
    apply(stored);

    document.querySelector('.theme-toggle')?.addEventListener('click', e => {
      const btn = e.target.closest('.theme-toggle-btn');
      if (btn && THEMES.includes(btn.dataset.theme)) {
        apply(btn.dataset.theme);
      }
    });

    // Respond to system preference changes when in system mode
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (getStored() === 'system') {
        document.documentElement.removeAttribute('data-theme');
      }
    });
  }

  // Apply before paint to prevent flash
  apply(getStored());
  document.addEventListener('DOMContentLoaded', init);
})();
```

Place a `<script>` tag loading this file **before** `</head>` — not deferred — to prevent a white flash on dark system preference.

### 13.5 System Preference Media Query

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    /* all dark theme tokens from Section 4.5 */
    --bg-page:        var(--neutral-950);
    /* … */
  }
}
```

---

## Appendix A: API Error Handling

| Scenario | Response code | UI treatment |
|----------|--------------|--------------|
| File too large | 413 | Error toast: "File exceeds the size limit." |
| Duplicate PDF | 409 | Warning toast: "This PDF was already processed. Exam ID: {id}" with link to exam |
| Invalid URL | 422 | Inline error below URL input: "Invalid URL format" |
| API offline | Network error (fetch throws) | Error banner on page, health indicator turns red |
| Job not found | 404 | Empty state on Job detail page |
| Exam not found | 404 | Inline error in the exam detail page header |
| Server error | 500 | Error toast: "Server error. Check the API logs." |

---

## Appendix B: Accessibility Baseline

- All interactive elements are keyboard-navigable in logical DOM order.
- Focus rings are always visible (`outline` never set to `none` without a replacement).
- Color is never the sole conveyor of meaning — badges always include a text label alongside color.
- The confidence bar always shows the numeric value alongside the bar.
- Badges have sufficient contrast: all `--text-*` on badge backgrounds meet WCAG 2.1 AA (4.5:1 for small text).
- Status badges use `role="status"` where they update live (job polling).
- The upload zone has a visible keyboard focus state and an `aria-label`.
- Modal has `role="dialog"`, `aria-modal="true"`, focus is trapped on open, and returns to the trigger row on close.
- Pagination prev/next buttons include `aria-label="Previous page"` / `aria-label="Next page"`.
- Table column headers use `<th scope="col">`. Sortable columns use `aria-sort`.

---

## Appendix C: Responsive Breakpoints

```css
/* tokens.css */
--breakpoint-sm:  480px;
--breakpoint-md:  768px;
--breakpoint-lg:  1024px;
--breakpoint-xl:  1280px;
```

| Breakpoint | Layout change |
|------------|---------------|
| < 480px | Single column everything. Upload zone collapses to minimal height. Table columns reduced to: #, Confidence, Enunciado only. |
| 480–767px | Same as above but with more padding. |
| 768–1023px | Sidebar collapses to icon-only (56px). Filter panel becomes a sheet (triggered by "Filters" button). Table shows all columns. |
| 1024px+ | Full layout: 200px sidebar + filter panel + table. |

---

*End of UX Specification — Knowledge Base Builder UI v1.0*
