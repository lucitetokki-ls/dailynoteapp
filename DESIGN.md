---
name: Terminal Protocol 01
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1b1b1b'
  on-surface-variant: '#4c4546'
  inverse-surface: '#303030'
  inverse-on-surface: '#f1f1f1'
  outline: '#7e7576'
  outline-variant: '#cfc4c5'
  surface-tint: '#5e5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1b'
  on-primary-container: '#848484'
  inverse-primary: '#c6c6c6'
  secondary: '#5c5f5d'
  on-secondary: '#ffffff'
  secondary-container: '#e1e3e0'
  on-secondary-container: '#626563'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#002116'
  on-tertiary-container: '#249474'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c6'
  on-primary-fixed: '#1b1b1b'
  on-primary-fixed-variant: '#474747'
  secondary-fixed: '#e1e3e0'
  secondary-fixed-dim: '#c5c7c4'
  on-secondary-fixed: '#191c1b'
  on-secondary-fixed-variant: '#444746'
  tertiary-fixed: '#8ff6cf'
  tertiary-fixed-dim: '#73d9b4'
  on-tertiary-fixed: '#002116'
  on-tertiary-fixed-variant: '#00513c'
  background: '#f9f9f9'
  on-background: '#1b1b1b'
  surface-variant: '#e2e2e2'
typography:
  h1:
    fontFamily: Inter
    fontSize: 64px
    fontWeight: '800'
    lineHeight: '1.0'
    letterSpacing: -0.04em
  h2:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  h3:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  technical-label:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.1em
  quoted-label:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.0'
  status-number:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '900'
    lineHeight: '1.0'
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 32px
  xl: 64px
  gutter: 1px
---

## Brand & Style
The brand identity is rooted in **Neo-Brutalism** and **Industrial Futurism**. It evokes the feeling of a mission-critical terminal or a high-precision digital logbook. The aesthetic is intentionally "unrefined" yet highly structured, prioritizing raw functionality and data density over decorative softness.

The target audience consists of power users, engineers, and researchers who value speed, systematic organization, and a "high-tech/low-life" aesthetic. The emotional response should be one of discipline, focus, and authoritative clarity. The UI utilizes heavy 1px and 2px borders, monochromatic surfaces with high-visibility accents, and monospaced technical labels to create a digital workspace that feels like a physical piece of hardware.

## Colors
The palette is dominated by **Industrial Black** (#000000) and **Paper White** (#F9FAF7), creating a high-contrast foundation that ensures maximum readability. 

- **Primary:** Pure Black is used for all structural borders, primary text, and high-impact containers.
- **Accent (Mint):** A high-visibility "Accent Mint" (#98FFD8) is used sparingly for status indicators, primary actions, and progress highlights. It acts as the primary "active" state color.
- **Secondary/Neutral:** A range of greys (Ghost Grey and Secondary Grey) are used for technical metadata and decorative grid lines to reduce visual noise in non-essential areas.
- **Functional Patterns:** Diagonal stripes (Mint/Black) are used for specific "Active" or "System" states to provide a tactile, industrial warning-tape feel.

## Typography
The typography system uses a dual-font approach to distinguish between content and system metadata.

- **Inter:** The primary workhorse for headlines and body content. It is used in heavy weights (800-900) for large numerical data and daily headers to create a "printed" look.
- **Space Grotesk:** Reserved for technical labels, status codes, and button text. Its geometric quirks reinforce the "technical" and "futuristic" brand personality.
- **Formatting:** All system labels should be uppercase with increased letter spacing. Quoted labels (e.g., "DASHBOARD") are used for navigation items to simulate directory paths or string values.

## Layout & Spacing
The layout follows a **Rigid Grid** philosophy. Content is contained within strict borders, often sharing edges to create a "paneled" look.

- **Grid:** A 1px "Gutter" is used between grid items (achieved by using a black background behind white panels) to create crisp, hair-line divisions.
- **Structure:** A fixed-width left sidebar (64 units) houses navigation, while the main canvas utilizes a fluid-width header and multi-column grid sections for data display.
- **Rhythm:** Spacing follows a 4px base unit. Internal padding within panels is generous (32px) to offset the density of the borders and technical labels.

## Elevation & Depth
This system rejects shadows entirely in favor of **Structural Layering** and **Bold Borders**.

- **Flat Depth:** Hierarchy is established through background color shifts (Paper White vs. Surface Muted) and border weight.
- **Active States:** Active cards or focused inputs may increase border weight from 1px to 2px or introduce the Mint accent color.
- **Dividers:** Horizontal and vertical 1px lines are the primary tool for separating information. There is no concept of "z-index" shadows; depth is strictly 2D, resembling a technical blueprint.

## Shapes
The shape language is strictly **Geometric and Sharp**. 

- **Corner Radius:** Every element—including buttons, input fields, and containers—has a 0px border radius. 
- **Icons:** Icons are used within square, bordered frames or as raw symbols without background housing.
- **Decorative Elements:** 45-degree diagonal stripes are used as a secondary shape motif to indicate "filling" or "active" status in status blocks.

## Components
- **Buttons:** Sharp-edged boxes with 2px borders. Primary buttons use the Accent Mint background with black text. Hover states invert the colors or switch to black backgrounds with white text.
- **Input Fields:** Minimalist design featuring only a bottom border (1px). Focus states increase the bottom border to 2px. Labels are positioned above the input in a small, technical font.
- **Cards/Panels:** Defined by a 1px primary border. They consist of a "Header" section with a muted background and a "Body" section for content.
- **Navigation Tabs:** Text-based with a heavy bottom border (Accent Mint) for active states. Links are often prefixed with "quoted" strings or icons.
- **Status Indicators:** Large, bold numerals paired with technical labels. High-importance stats use the Accent Mint background.
- **Icons:** Material Symbols Outlined, used with a standard weight (400) and no fill, except for rating systems where "Fill" is used to indicate value.