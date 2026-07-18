# Sweet Design System — Static HTML/CSS

A dependency-free, static extraction of the **sweet-design-system** Figma file
(`57SeedEfsbD0BH2tlRBmjo`), intended as a reference kit for building a security
SaaS product. It is deliberately written to be **easy for a coding agent to read
and reuse**: plain HTML, one flat CSS token layer, and predictable `sds-` class
names — no framework, no build step.

## Quick start

Open `index.html` in a browser. It is the gallery: links to every component
page plus an overview of colors, typography, and icons.

Every page links the three stylesheets in this order:

```html
<link rel="stylesheet" href="css/tokens.css" />      <!-- design tokens (variables) -->
<link rel="stylesheet" href="css/base.css" />        <!-- reset + .ds-* typography  -->
<link rel="stylesheet" href="css/components.css" />  <!-- .sds-* components          -->
```

## Structure

```
design-system/
├── index.html                 # gallery / entry point
├── css/
│   ├── tokens.css             # single source of truth: all design tokens
│   ├── base.css               # CSS reset + .ds-* typography utility classes
│   └── components.css         # all .sds-* component styles
├── components/                # one showcase page per Figma page
│   ├── buttons.html
│   ├── badges.html            # Badges & Chips
│   ├── inputs.html            # Inputs & Controls
│   ├── navigation.html
│   ├── table.html
│   ├── cards.html             # Cards & Stats
│   ├── charts.html            # Charts & Indicators
│   └── overlays.html          # Overlays & Feedback
└── assets/
    └── icons/                 # 25 themeable SVG icons (use currentColor)
```

## How it is organized

### Tokens (`css/tokens.css`)
Two layers:
1. **Primitives** — raw palette (`--gray-900`, `--red-700`, `--coral-500`, …).
   Don't reference these directly in product code.
2. **Semantic tokens** — meaning-based names you *should* use everywhere:
   - Backgrounds: `--color-bg-page`, `--color-bg-surface`, `--color-bg-subtle`, `--color-bg-ink`
   - Text: `--color-text-primary/secondary/muted/disabled/inverse/link`
   - Borders: `--color-border-default/strong/ink`
   - **Severity** (the core signal language): `--color-severity-critical/high/medium/low` (+ `-tint`)
   - Status: `--color-status-success/warning/info/error` (+ `-tint`)
   - Accents: `--color-accent-coral/ai`, Category: `--color-category-vulnerabilities/secrets/findings/issues`
   - Spacing (2px scale): `--space-2xs`…`--space-5xl`
   - Radius: `--radius-xs/sm/md/lg/xl/full`
   - Typography: `--font-size-*` / `--line-height-*` pairs, `--font-weight-*`, `--font-sans`, `--font-mono`
   - Elevation: `--shadow-card/sm/md/lg/overlay/dropdown`

### Typography (`css/base.css`)
Utility classes map to the Figma type scale: `.ds-page-title`, `.ds-section`,
`.ds-card-title`, `.ds-body`, `.ds-body-strong`, `.ds-small`, `.ds-label`,
`.ds-caption`, `.ds-stat-lg`, `.ds-stat-md`, `.ds-code`.

### Components (`css/components.css`)
All prefixed `sds-`, using BEM-ish modifiers. Groups: Buttons, Badges & Chips,
Inputs & Controls, Navigation, Table, Cards & Stats, Charts & Indicators,
Overlays & Feedback. Each component references semantic tokens only, so
re-theming means editing `tokens.css` alone.

### Icons (`assets/icons/`)
25 SVGs, cleaned so the ink uses `currentColor` — set the color via CSS `color`
on the parent, or `<img>` and tint with the `.sds-icon-inverse` helper
(`filter: invert(1)`) for white-on-dark chrome.

## Conventions for a coding agent

- Use **semantic tokens**, never primitives, in new UI.
- Use **severity tokens** for anything Critical/High/Medium/Low.
- Component class = `sds-<name>`; variants = `sds-<name>--<modifier>`; state = `.is-<state>`.
- Dynamic values are set via inline custom properties, e.g. progress fill width
  (`style="width:86%"`) and donut sweep (`style="--sds-donut-value:78"`).
- Everything is static and framework-agnostic — port markup to React/Vue/etc.
  by keeping the class names and token references intact.

## Source

Extracted from Figma via the Figma MCP server (design context + variable
definitions + asset export). Pages covered: Foundations (Colors, Typography,
Spacing & Radius), Icons, Buttons, Badges & Chips, Inputs & Controls,
Navigation, Table, Cards & Stats, Charts & Indicators, Overlays & Feedback.
