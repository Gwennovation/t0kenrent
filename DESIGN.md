---
name: T0kenRent
description: Trustless peer-to-peer rental marketplace on BSV blockchain
colors:
  transmission: "#38bdf8"
  transmission-deep: "#0ea5e9"
  pulse: "#e879f9"
  pulse-deep: "#d946ef"
  abyss: "#09090b"
  infrastructure-900: "#18181b"
  infrastructure-800: "#27272a"
  infrastructure-700: "#3f3f46"
  infrastructure-600: "#52525b"
  infrastructure-400: "#a1a1aa"
  infrastructure-200: "#e4e4e7"
  surface-text: "#fafafa"
  status-active: "#10b981"
  status-active-text: "#34d399"
  status-occupied: "#ef4444"
  status-occupied-text: "#f87171"
  status-pending: "#f59e0b"
  status-pending-text: "#fbbf24"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1.875rem, 3.5vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.025em"
    fontFeature: "'cv02', 'cv03', 'cv04', 'cv11'"
  headline:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.01em"
  mono:
    fontFamily: "JetBrains Mono, Fira Code, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.transmission-deep}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "#0284c7"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-secondary:
    backgroundColor: "{colors.infrastructure-800}"
    textColor: "{colors.surface-text}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.transmission}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.infrastructure-400}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-accent:
    backgroundColor: "{colors.pulse-deep}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  card:
    backgroundColor: "{colors.infrastructure-900}"
    textColor: "{colors.surface-text}"
    rounded: "{rounded.lg}"
    padding: "24px"
  input:
    backgroundColor: "{colors.infrastructure-800}"
    textColor: "{colors.surface-text}"
    rounded: "{rounded.md}"
    padding: "14px 16px"
---

# Design System: T0kenRent

## 1. Overview

**Creative North Star: "The Clear Exchange"**

T0kenRent is a trustless marketplace. The complexity — the multisig escrow, the BSV micropayments, the on-chain records — is handled entirely by the infrastructure. The surface is calm. This design system exists to make every state legible, every action deliberate, and every outcome certain. Trustless does not mean opaque; it means the trust is in the code, not the platform, and the UI reflects that with precision rather than reassurance.

Dark is the default environment. Not as a crypto signal, not as an aesthetic choice made in a vacuum, but because this is a focused operational tool. The user is committing a deposit, confirming a rental, checking an escrow state. The darkness concentrates attention. The surface layers (zinc-900 through zinc-700) establish hierarchy through tonal steps, not color noise. Glass cards create structured depth — they are containers with purpose, not decoration.

Transmission Blue is the single interactive signal. It appears on actions, focus states, and financial confirmation. Pulse Fuchsia is reserved for the highest-stakes action on any given screen: the moment a deposit is locked or a rental confirmed. These colors are rare because their rarity is what makes them mean something.

**Key Characteristics:**
- Dark operational environment with tonal zinc surface layering
- Glass containers as structured depth (not decorative blur)
- Single primary interactive signal (Transmission Blue)
- Legible rental state via three unambiguous status colors
- Monospace type for all financial values, addresses, and transaction data
- Restraint over decoration — bold through precision, not effects

This system explicitly rejects: neon-on-black crypto aesthetics, purple/teal gradient washes, glow-on-everything interactions, and Airbnb-style warm marketplace warmth. It is not DeFi. It is not a rental listing directory. It is infrastructure that regular people can use.

## 2. Colors: The Transmission Palette

Two signal colors on a deep zinc canvas. Everything else is neutral or semantic.

### Primary
- **Transmission** (`#38bdf8`, sky-400): The interactive signal. Used on focused input borders, active tab indicators, link text, and primary CTA buttons. In dark mode. Never decorative.
- **Transmission Deep** (`#0ea5e9`, sky-500): The action color in button fills. Slightly more authoritative than Transmission; reserve for the most important primary CTA on any screen.

### Secondary
- **Pulse** (`#e879f9`, fuchsia-400): The escrow accent. Appears at the highest-stakes moment: confirming a rental deposit, locking an escrow. One use per screen maximum.
- **Pulse Deep** (`#d946ef`, fuchsia-500): The button fill for the accent action. Same restraint applies.

### Neutral
- **Abyss** (`#09090b`): The canvas. Every screen's base.
- **Infrastructure-900** (`#18181b`): Primary card and surface background. Glass cards layer over Abyss.
- **Infrastructure-800** (`#27272a`): Input backgrounds, secondary surfaces, nested containers.
- **Infrastructure-700** (`#3f3f46`): Borders, dividers, tab active states.
- **Infrastructure-600** (`#52525b`): Disabled states, placeholder borders.
- **Infrastructure-400** (`#a1a1aa`): Muted text, secondary labels, ghost button text.
- **Infrastructure-200** (`#e4e4e7`): Used in light mode surfaces only; rare in dark contexts.
- **Surface Text** (`#fafafa`): All primary body text on dark surfaces.

### Semantic (Rental Status)
- **Active** (`#10b981` background, `#34d399` text): Listing is available to rent.
- **Occupied** (`#ef4444` background, `#f87171` text): Currently rented.
- **Pending** (`#f59e0b` background, `#fbbf24` text): Transaction in progress.

**The Transmission Rule.** Transmission Blue and Pulse Fuchsia appear on interactive elements and transaction confirmations only. They are never used for section dividers, icon accents, typographic highlights, or decorative borders. Their scarcity is functional.

**The Status Legibility Rule.** Rental status badges must always use the three semantic colors above, never any variation. If a state cannot be expressed as active/occupied/pending, add a new semantic token rather than reusing a neutral or brand color.

## 3. Typography

**Body & Display Font:** Inter (system-ui, -apple-system fallback)
**Mono Font:** JetBrains Mono (Fira Code fallback)

**Character:** A single sans-serif family used at contrasting weights creates hierarchy through density, not decoration. Inter's OpenType features (cv02–cv04, cv11) are enabled globally for disambiguated characters, a meaningful choice in a platform displaying wallet addresses and transaction IDs.

### Hierarchy
- **Display** (700, clamp 1.875–2.5rem, leading 1.1, tracking -0.025em): Page-level headers — marketplace title, dashboard section names. Appears once per screen.
- **Headline** (600, 1.5rem, leading 1.25, tracking -0.02em): Modal titles, card section labels. Tight tracking keeps it compact.
- **Title** (600, 1.125rem, leading 1.4, tracking -0.01em): Asset card names, tab panel headings. The workhorse heading.
- **Body** (400, 0.875rem, leading 1.6): All descriptive text, item descriptions, instructions. Max 65–75ch line length on prose.
- **Label** (600, 0.75rem, leading 1.4, tracking 0.01em): Form labels, badge text, stat captions. Small but never light.
- **Mono** (400, 0.8125rem, leading 1.6): All financial amounts, wallet addresses, transaction hashes, token IDs. Non-negotiable.

**The Mono Rule.** Every number representing currency, every wallet address, every token ID, and every transaction hash must render in JetBrains Mono. This is not stylistic — it prevents character confusion in financial strings and signals to the user that this is precise, machine-verified data.

## 4. Elevation

This system uses glass as a structured depth metaphor, not a decorative blur. Depth comes from two sources: tonal surface layering (Abyss → Infrastructure-900 → Infrastructure-800) and glass cards with controlled shadow.

Surfaces are flat at rest within their layer. Shadow only appears on state (hover lift, modal emergence, active drag). No ambient glow on interactive elements; glow effects are prohibited — they make the primary color feel decorative rather than functional.

### Shadow Vocabulary
- **Ambient Card** (`0 4px 20px -1px rgba(0,0,0,0.3), 0 2px 10px -2px rgba(0,0,0,0.2)`): Default glass card at rest. Dark, soft, no color bleed.
- **Hover Lift** (`0 20px 50px -10px rgba(0,0,0,0.5), 0 8px 20px -8px rgba(0,0,0,0.3), 0 0 0 1px rgba(56,189,248,0.08)`): Card on hover — elevation increase plus a hairline Transmission border inset.
- **Modal Emergence** (`0 25px 60px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)`): Full modal lift. The darkest shadow. No primary color bleed.
- **Input Focus** (`0 0 0 3px rgba(56,189,248,0.15)`): Focus ring. Transmission Blue at 15% opacity. Never a colored glow.

**The Structured Glass Rule.** Glassmorphism (backdrop-filter blur + semi-transparent background) is permitted on cards and modals only. It is prohibited on buttons, badges, navigation, and any element that does not serve as a primary content container. The glass must have a 1px border at infrastructure-700 opacity (≥ 50%) — never borderless. The blur is 24px max. If you are using blur for decoration, remove it.

**The No-Glow Rule.** `box-shadow` values containing a colored rgba spread (e.g., `rgba(14, 165, 233, 0.4)`) are prohibited except for the input focus ring. Shadows must be dark (rgba(0,0,0,X)) or the focus ring (rgba(56,189,248,0.15)). No `glow-sm`, `glow`, `glow-lg`, or `glow-accent` class usage on new components.

## 5. Components

### Buttons
Twelve-pixel radius (rounded-md) across all variants. The shape is decisive but not pill-like — a tool, not a consumer app.

- **Primary** (`background: linear-gradient(to right, #0ea5e9, #0284c7)`, white text, 12px/24px padding): The main action. One per screen segment.
- **Primary Hover**: shifts gradient to `#0284c7 → #0369a1`, lifts 2px with `translateY(-2px)`, box-shadow becomes larger dark shadow only.
- **Secondary** (Infrastructure-800 fill, surface text, 1px Infrastructure-700 border): Supporting actions — edit, cancel, secondary choice.
- **Outline** (transparent fill, Transmission text, 1.5px Transmission-40% border): Alternative to secondary when de-emphasis is important. Hover fills with Transmission at 8% opacity.
- **Ghost** (transparent fill, Infrastructure-400 text): Tertiary and inline actions. No border.
- **Accent** (`background: linear-gradient(to right, #d946ef, #c026d3)`, white text): The escrow confirmation, the deposit lock. One per flow. Never used for convenience actions.

### Cards
Glass containers. Background: rgba(24,24,27,0.7). Backdrop-filter: blur(24px). Border: 1px solid rgba(63,63,70,0.5). Radius: 16px (rounded-lg). Shadow: Ambient Card at rest.

On hover: border shifts to rgba(56,189,248,0.2), shadow shifts to Hover Lift, `translateY(-3px)` with 300ms cubic-bezier(0.4,0,0.2,1) ease-out. Never bounce or spring.

Internal padding: 24px. Nested content uses 16px gutters. Cards do not nest — a card inside a card is always wrong.

### Inputs / Fields
Background: rgba(39,39,42,0.5). Border: 1px solid Infrastructure-700. Radius: 12px. Padding: 14px 16px. Placeholder: Infrastructure-400 (`#a1a1aa`). Body text on focus.

Focus: border shifts to Transmission, box-shadow to Input Focus ring. No fill change on focus. Hover: border shifts to Infrastructure-600. Error state: border shifts to Status-Occupied (`#ef4444`), focus ring uses red variant.

### Status Badges
Pills (border-radius: full). Backdrop-filter: blur(8px). 6px/12px padding. Label size (0.75rem, 600 weight). Each has a 10px leading dot in the status color.

Active: rgba(16,185,129,0.2) background, #34d399 text, rgba(16,185,129,0.3) border.
Occupied: rgba(239,68,68,0.2) background, #f87171 text, rgba(239,68,68,0.3) border.
Pending: rgba(245,158,11,0.2) background, #fbbf24 text, rgba(245,158,11,0.3) border.

### Tabs (Segmented Control)
Container: rgba(39,39,42,0.8) fill, 6px padding, 12px radius, 1px Infrastructure-700 border, backdrop blur 8px. Items: 10px/16px padding, 8px inner radius.

Active tab: Infrastructure-700 fill (`#3f3f46`), Transmission text, no shadow. Inactive: transparent fill, Infrastructure-400 text. Hover: rgba(63,63,70,0.5) fill, surface-text color. Transition: 200ms ease on background and color.

### Navigation (App Header)
Dark surface (Abyss / transparent-over-dark). Inter medium (500). Items: ghost button style at 0.875rem. Active route: Transmission text only — no background fill, no underline. Wallet indicator: compact, 28px avatar/logo, right-aligned.

### Escrow Status (Signature Component)
The most important custom component in the system. A horizontal status bar showing: Deposit Pending → Escrow Active → Both Signed → Complete. Each step is a labeled node. The active node is Transmission Blue with Infrastructure-700 background. Completed nodes are Status-Active green with a checkmark. Pending nodes are Infrastructure-600 with a hollow circle. The connector line between nodes uses Infrastructure-700 at rest, Status-Active on completed segments. All labels in mono if they include an amount.

### Multi-step Wizard (CreateAssetModal)
A 4-step form (Basic Info → Pricing → Location → Review) with a horizontal progress stepper above the form body.

**Stepper nodes:** 36px square with 12px radius. Active/past: Transmission gradient fill (`#0ea5e9 → #0284c7`), white text/icon. Completed past steps: Transmission fill + white checkmark SVG. Pending future steps: Infrastructure-700 fill (`#3f3f46`), Infrastructure-400 text. Connector lines between nodes: 4px height, full radius. Completed segment: Transmission Blue. Pending segment: Infrastructure-700. Label row below the stepper: Transmission text for current/past steps, Infrastructure-400 for future.

**Important:** The active step node must NOT carry `shadow-primary-500/25`. Colored shadows are prohibited (No-Glow Rule). The gradient fill is sufficient to signal active state.

**Modal structure:** Glass card with Transmission gradient header (no grid-pattern background-image — that was decorative noise). Header: step title + close button (white/20 fill, 32px, 8px radius). Progress stepper on Infrastructure-800/50 background strip. Form body: 24px padding, 20px vertical gap between fields. Footer: Infrastructure-800/50 background strip, space-between layout, ghost Back + primary Continue (disabled when step invalid).

**Step 4 (Review):** Data summary grid — 2-column grid inside an Infrastructure-800/50 container (16px radius, 24px padding, 1px Infrastructure-700/50 border). Each cell: label in label size + Infrastructure-400 color, value in title weight + surface-text. Financial values in Transmission for daily rate, surface-text for deposit. Unlock fee in mono. Accessory tags: small pills (Infrastructure-700 fill, surface-text, 1px Infrastructure-700 border, full radius).

### Callout / Info Card
Tinted information panel. Used inline in forms for tips, warnings, and confirmation messages. Not a modal — always inline inside a parent container.

Structure: rounded-xl (12px radius), 16px padding, flex row with leading 20px icon + content block. Icon aligns to top. Never use backdrop-filter on callouts.

Four semantic variants:
- **Info** (Transmission): Infrastructure-900/20 dark background, Infrastructure-700/50 border, Transmission text for heading. Use for instructional tips and pricing guidance.
- **Warning** (Amber): rgba(245,158,11,0.15) background, rgba(245,158,11,0.3) border, #fbbf24 heading. Use for demo mode banners, payment notes.
- **Success** (Emerald): rgba(16,185,129,0.15) background, rgba(16,185,129,0.3) border, #34d399 heading. Use for "ready to submit" confirmations.
- **Accent** (Pulse): rgba(217,70,239,0.15) background, rgba(217,70,239,0.3) border, #e879f9 heading. Use sparingly — only for blockchain/tokenization context callouts.

Callout headings: label weight (600, 0.75rem). Body text: body size (0.875rem), Infrastructure-400. Lists inside: disc, 16px left indent, 4px row gap.

### Stat Overview Cards
4-column grid (2-col on mobile) of summary metrics. Each card: glass card container, 20px padding, centered layout.

**Icon wrapper:** 48px square, 12px radius, tinted fill. Use only design-system semantic tints: emerald-tint for active counts, Transmission-tint for financial totals, amber-tint for spend values. Never use `text-purple-*` or purple tints — purple is outside this color system. Substitute Infrastructure-400 for any "neutral count" stat that has no semantic color.

**Metric number:** 30px (text-3xl), 700 weight. Color follows the semantic role: Status-Active text (`#34d399`) for active/positive counts, Transmission (`#38bdf8`) for earnings, amber (`#fbbf24`) for spend, Infrastructure-400 for neutral counts.

**Label:** body size (0.875rem), Infrastructure-400. No icon, no sub-label.

**The No-Hero-Metric Rule.** These cards display real operational data, not marketing claims. No gradient fills on the metric number, no pulse animations on the count, no decorative accent lines. The number is the entire signal.

### Rental Progress Card (Active Rental)
The active rental card in the Rentals tab. Glass container with hover lift. 20px padding.

Header row: asset name (title weight) + total amount (Transmission, 1.125rem bold) on opposite ends. Sub-row: date range + duration in body/muted, days-remaining countdown in Status-Active text with a 6px animated pulse dot.

**Progress bar:** 4px track, full radius. Background: Infrastructure-700. Fill: linear-gradient(to right, #10b981, #38bdf8) — Status-Active green into Transmission. Animates width with 600ms ease transition on mount.

Footer row: escrow TX ID as a mono Transmission link (10px truncated + external-link icon, 12px) on the left; action buttons (QR + Complete) on the right. QR: Transmission-tint fill text button. Complete: Status-Active emerald fill, white text. Both: 8px radius, 6px/12px padding.

### Transaction Table Row
Used in the Transactions tab inside a borderless glass-card container. Standard `<table>` with `border-collapse`.

**Column headers:** label weight (600, 0.75rem), Infrastructure-400 text, 12px/16px cell padding, bottom border 1px Infrastructure-700.

**Row structure (left to right):** (1) Type icon — 32px square, 8px radius, semantic tint fill + icon. Payment: red-tint. Deposit: amber-tint. Refund: emerald-tint. Unlock: Transmission-tint. (2) Description — body size, surface-text. Asset name in sub-line at Infrastructure-400. (3) Amount — 600 weight. Debit: Status-Occupied text (`#f87171`) with leading `-`. Credit: Status-Active text (`#34d399`) with leading `+`. (4) Status — mini pill badge (confirmed: emerald, pending: amber). (5) TX ID — mono Transmission link, truncated to 10 chars + `...`, external-link icon at 12px. (6) Date — body size, Infrastructure-400.

Row separator: 1px Infrastructure-800 border-bottom. No hover fill on rows — the table is read-only.

### Wallet Info Card
Compact glass card displayed in the dashboard header, right-aligned.

Structure: 16px padding, flex row, 16px gap. Leading 48px icon avatar (Transmission → Pulse gradient fill, 12px radius, 24px icon in white). Content block: wallet type label (label size, Infrastructure-400) + animated 6px emerald pulse dot on the same line. Truncated wallet key in mono (0.875rem, surface-text): show first 10 + last 6 chars separated by `...`. BSV balance on its own line: bold Transmission (1rem), followed by USD conversion in Infrastructure-400 (0.75rem) on the same baseline.

**No colored shadow on the icon avatar.** The existing `shadow-primary-500/20` is a glow violation — remove it. The gradient fill is enough.

### Empty State
Displayed inside a glass card when a list has no items. Centered layout, 32px vertical padding.

32px muted icon (Infrastructure-600 stroke, 1.5 strokeWidth). 16px gap below. Body-size text in Infrastructure-400. No CTA button unless the empty state has an obvious resolution action (e.g., "List your first item" → primary button). Never use decorative illustrations or gradient backgrounds on empty states.

## 6. Do's and Don'ts

### Do:
- **Do** use Transmission Blue exclusively on interactive elements — buttons, focus rings, active states, links. Its scarcity gives it meaning.
- **Do** render all financial amounts, wallet addresses, token IDs, and transaction hashes in JetBrains Mono.
- **Do** use all three status colors (emerald/red/amber) for rental state. Never substitute or approximate.
- **Do** use glass (backdrop-filter blur) only on cards and modals, with a 1px border and structured shadow.
- **Do** animate with `cubic-bezier(0.4, 0, 0.2, 1)` ease-out and 200–300ms duration. State changes, not choreography.
- **Do** respect `prefers-reduced-motion` — all transitions and animations are governed by the existing reduced-motion media query.
- **Do** use tonal layering (Abyss → Infrastructure-900 → Infrastructure-800) to establish depth before reaching for shadows or borders.
- **Do** keep Pulse Fuchsia to one use per screen: the highest-stakes confirmation action.
- **Do** use semantic tints for stat card icon wrappers: emerald for active counts, Transmission for financial totals, amber for spend values, Infrastructure-400 for neutral counts.

### Don't:
- **Don't** use neon-on-black crypto aesthetics: no purple/teal gradient washes, no laser-grid backgrounds, no token hype visual language. This is not DeFi.
- **Don't** use gradient text (`background-clip: text` with a gradient background). Use a solid Transmission or surface-text color instead.
- **Don't** add colored glow box-shadows (`rgba(14,165,233,0.4)` style) to buttons, cards, or any element. The existing `glow`, `glow-sm`, `glow-lg`, and `glow-accent` utility classes are deprecated — remove them on any component you touch. This explicitly includes `shadow-primary-500/25` on stepper nodes and `shadow-emerald-500/25` on submit buttons.
- **Don't** use glass (backdrop-filter) on buttons, badges, navigation, or any non-container element.
- **Don't** use border-left or border-right greater than 1px as a colored stripe accent. Rewrite with a full border, background tint, or leading icon.
- **Don't** display wallet addresses, amounts, or transaction IDs in Inter. Mono only.
- **Don't** use the warm Airbnb marketplace aesthetic — no large hero photography, no warm pastel tones, no "find your next adventure" copy register.
- **Don't** nest cards. If you need depth inside a card, use a background-tint container (Infrastructure-800) without radius or shadow.
- **Don't** animate layout properties (width, height, top, left, margin, padding). Animate transform and opacity only.
- **Don't** use Pulse Fuchsia for more than one action per screen — it signals the escrow moment. Using it on multiple elements destroys its meaning.
