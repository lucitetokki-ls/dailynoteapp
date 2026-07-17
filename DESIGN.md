---
name: Lucitetokki Daily Action Log Design System
register: product
theme: neo-brutal personal operating system
colors:
  paper: "#fcfbf8"
  white: "#fffffe"
  black: "#111111"
  mint: "#98ffd9"
  mint-deep: "#111111"
  muted: "#444441"
  faint: "#d7d7d2"
  soft: "#f9fafb"
typography:
  primary:
    family: "Pretendard"
    usage: "Korean-first product UI, body copy, mobile UI, forms"
  display:
    family: "Inter, Pretendard"
    usage: "large Latin labels, desktop product headings, brand wordmarks"
  technical:
    family: "Space Grotesk, Pretendard"
    usage: "kickers, route codes, chips, compact metadata"
spacing:
  base: 4px
  compact: 8px
  panel: 20px-32px
  desktop-canvas-margin: 40px
  mobile-side-padding: 20px
radius: 0px
border: 1px solid black
---

# Design System

Lucitetokki Daily Action Log is a personal operating system for daily execution. The interface should feel like a sharp paper terminal: bright, disciplined, high-contrast, and slightly mechanical, without becoming dark, heavy, or decorative.

The visual direction is not a generic wellness tracker. It is a daily control panel for one person who wants to write down what was actually done.

## Design Intent

- **Physical feel:** printed dashboard, terminal index, field log, technical worksheet.
- **Emotional tone:** disciplined, private, focused, a little severe, but still bright.
- **Primary palette:** mint, white, black.
- **Design register:** product UI. The design supports repeated daily use, so clarity wins over spectacle.
- **Core tension:** make the app visually memorable, but keep input friction low.

## Color

Use a restrained mint/white/black system.

- **Paper background:** `#fcfbf8`
- **Panel surface:** `#fffffe`
- **Ink / border:** `#111111`
- **Primary mint:** `#98ffd9`
- **Muted copy:** `#444441`
- **Faint divider:** `#d7d7d2`
- **Soft panel:** `#f9fafb`
- **Danger:** saturated red only for errors or destructive feedback

Rules:

- Mint is for active states, primary status, selected filters, sync pills, and filled cells.
- Black is for borders, text, section dividers, selected dark states, and structural rhythm.
- White/off-white is the dominant surface.
- Avoid random green tones. If it reads green rather than mint, replace it.
- Avoid decorative gradients, soft glows, glass effects, and pastel card clutter.
- Desktop may use black/mint diagonal striping as a sidebar motif. Mobile should stay flatter and cleaner.

## Typography

This is a Korean-first app. Pretendard must be reliable across desktop and mobile.

- **Pretendard:** default UI font, especially for Korean text and mobile.
- **Inter:** acceptable for desktop Latin-heavy display text and the ROUTINE wordmark.
- **Space Grotesk:** acceptable for technical micro-labels, route codes, and uppercase system text.

Rules:

- Do not scale fonts purely by viewport width except within controlled mobile hero clamps.
- Korean headings must remain readable and not wrap awkwardly.
- Mobile headings should be compact enough to let the user reach the actual record area quickly.
- Technical labels can be uppercase, but body copy should remain natural Korean.
- Keep letter spacing at `0` for Korean body text. Use tracking only for short Latin technical labels.

## Layout

The layout uses rigid panels, not soft cards.

Desktop:

- Fixed left sidebar.
- Main content starts at a consistent x-position.
- Page hero, metrics, forms, and section bodies should align to the same width.
- Sidebar is a product navigation rail, not a marketing decoration.
- Use large desktop headings, but keep metric cards compact.

Mobile:

- Fixed top brand bar.
- Fixed bottom navigation.
- No fake hamburger menu. If an icon looks interactive, it must be interactive.
- Use `20px` side padding.
- Keep page heroes shallow. Mobile users should see the first useful control quickly.
- Prefer two-column controls for small filter sets.
- Avoid horizontal scrolling except when explicitly designed.

## Shape And Borders

- Radius: `0px`.
- Borders: mostly `1px solid #111111`.
- Avoid nested card-in-card styling.
- Prefer full-width panels, dividers, and grid sections over floating cards.
- Shadows are not the main depth system. If used, keep them minimal and structural.

## Core Components

### App Shell

- Desktop: left sidebar with ROUTINE brand, numbered routes, profile block, and mint/black technical accent.
- Mobile: top brand bar and bottom tab bar.
- Active navigation uses mint fill or strong black contrast.
- Mobile nav labels should be short Korean labels.

### Page Hero

- Kicker: small technical label.
- Title: large, heavy, direct.
- Supporting copy: one sentence, not a feature explanation.
- On mobile, hero height must be compressed.

### Survey Card / Panel

- White surface, black border.
- Used for forms, status groups, search panels, calendar detail, empty states.
- Internal spacing should vary by density: compact stats, generous text input.

### Daily Slot Cards

- Six fixed daily slots: 식단, 운동, 코딩, 공부, 정리, 관계.
- The user records only completed actions.
- No Done / Partial / Skipped controls in Today.
- Each slot should feel like a designated input field, not an open-ended task list.

### Writing Studio

- A dedicated long-form writing area.
- It is intentionally separate from Today's study action slot.
- The editor should feel spacious and quiet compared with the dashboard.

### Review And Calendar

- Review is for rhythm and memory, not guilt tracking.
- Calendar shows daily history with compact previews.
- Long text should be expandable through a professional "full text" interaction, not by stretching every card.

### Search

- Search is a utility surface.
- Use query + category filters only unless there is a real need for more.
- Empty state copy should guide broadening the search without sounding like an error.

### Settings Gate

- Settings access can be gated with a light client-side prompt for personal use.
- The lock screen should still use the same page hero and panel language as the rest of the app.

## Interaction

- Primary actions should be obvious and bordered.
- Focus states must be visible.
- Textareas must be comfortable on mobile, with `16px` minimum font size to avoid zoom issues.
- Touch targets should be at least 44px high.
- Toasts and sync states should be informative, not dominant.
- If a visual element looks like a button, it should be clickable.

## Mobile Rules

- Mobile must not inherit desktop density blindly.
- Force the light mint/white/black theme unless a deliberate mobile dark toggle is implemented.
- If dark mode exists, it should use black/mint/white only, not random greens or slate tones.
- Top header should not contain non-functional menu icons.
- Bottom nav should remain stable and visible.
- Mobile hero headings should generally stay under `3rem`.

## Anti-Patterns

Do not use:

- Generic SaaS gradients.
- Glassmorphism.
- Rounded pill-heavy UI.
- Random emoji menus.
- Decorative hamburger icons.
- Big hero metric templates.
- Identical decorative card grids.
- Overly soft beige wellness-app styling.
- Dark terminal theme as the default mobile experience.
- Status tracking that makes the app about whether the user recorded, rather than what the user did.

## Reuse Notes For Future Projects

This design system works well for:

- Personal dashboards.
- Daily logs.
- Study trackers.
- Writing systems.
- Lightweight operating systems for one user.
- Apps where the user wants discipline, not social engagement.

For a different domain, preserve the structure but change the domain language. The strongest reusable parts are the fixed app shell, technical labels, sharp borders, mint active state, compact mobile hero, and designated input slots.
