---
name: Ecclesia Administrative Suite
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#444653'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#757684'
  outline-variant: '#c4c5d5'
  surface-tint: '#3755c3'
  primary: '#00288e'
  on-primary: '#ffffff'
  primary-container: '#1e40af'
  on-primary-container: '#a8b8ff'
  inverse-primary: '#b8c4ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#002e81'
  on-tertiary: '#ffffff'
  tertiary-container: '#0042b2'
  on-tertiary-container: '#a4b9ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c4ff'
  on-primary-fixed: '#001453'
  on-primary-fixed-variant: '#173bab'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#dbe1ff'
  tertiary-fixed-dim: '#b4c5ff'
  on-tertiary-fixed: '#00174b'
  on-tertiary-fixed-variant: '#003ea8'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.75rem
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 1.75rem
    fontWeight: '700'
    lineHeight: 2.25rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: 2.25rem
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 1.375rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.625rem
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.375rem
  body-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1.125rem
  label-lg:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: 1.25rem
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0.02em
  label-caps:
    fontFamily: Inter
    fontSize: 0.6875rem
    fontWeight: '700'
    lineHeight: 1rem
    letterSpacing: 0.06em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system is engineered for congregational stewardship, ecclesiastical governance, and community record-keeping. The system serves pastors, church administrators, ministry directors, and operational staff who require an orderly, distraction-free environment to oversee membership directories, sacrificial giving, sacramental logs, and event scheduling.

### Design Movement & Aesthetic Tone
The aesthetic movement is **Corporate Modern Minimalist**:
- **Dignity & Reverence:** Free of flashy animations, gamification elements, or aggressive decorative gradients.
- **Clarity & Order:** Strict reliance on data density, structural alignments, quiet borders, and balanced negative space to convey institutional reliability and institutional trust.
- **Utilitarian Elegance:** High-contrast data presentation paired with soft neutral backgrounds, delivering calm ergonomics during extended administrative workflows.

## Colors

The palette establishes an institutional balance using dependable deep blues, high-contrast dark slate surfaces, and clean functional backgrounds.

### Core Swatches
- **Primary Brand (`#1E40AF`):** Deep institutional blue. Used for primary calls-to-action, active sidebar indicators, table focus outlines, and high-level key metrics.
- **Primary Interactive Hover (`#2563EB`):** Elevated bright blue for interactive hover states and active text links.
- **Dark Navigation & Header (`#0F172A` / `#1E293B`):** Deep navy-slate used for permanent sidebars, top navigation bars, and terminal badges to anchor screen hierarchy.
- **Neutral Canvas (`#F8FAFC`):** Soft, muted background to prevent eye strain during data-heavy sessions.
- **Card & Modal Surface (`#FFFFFF`):** Pure white container surfaces layered on top of the neutral canvas.
- **Subtle Surface Tint (`#F1F5F9`):** Neutral gray-blue for table headers, secondary button resting states, and inactive tab tracks.
- **Structural Outlines (`#E2E8F0` / `#CBD5E1`):** Precise dividing borders for data grids, form field boundaries, and card perimeters.
- **Typography Tokens:** Primary text uses Slate 900 (`#0F172A`) for maximum legibility; secondary/metadata labels utilize Slate 500 (`#64748B`).

### Functional Semantic States
- **Success:** `#10B981` (Border/Text: `#047857`, Background: `#ECFDF5`) for tithe processing confirmation, active membership status, and verified attendance.
- **Warning:** `#F59E0B` (Border/Text: `#B45309`, Background: `#FFFBEB`) for pending volunteer clearances and scheduled event clashes.
- **Destructive/Error:** `#EF4444` (Border/Text: `#B91C1C`, Background: `#FEF2F2`) for overdue pledges, record deletion alerts, and failed transactions.
- **Information:** `#0EA5E9` (Border/Text: `#0369A1`, Background: `#F0F9FF`) for ministry announcements and administrative notices.

## Typography

The typography scale utilizes `Inter` across all structural tiers to prioritize cross-platform rendering precision and tabular number alignment.

### Typographic Hierarchy & Principles
- **Tabular Figures:** All financial amounts, census records, and dates must enforce OpenType tabular figures (`font-variant-numeric: tabular-nums`) to maintain vertical scanning fidelity across data columns.
- **Section & Category Headers:** Table section headers and auxiliary metadata employ `label-caps` in uppercase styling with Slate 500 (`#64748B`) to establish distinct visual division without adding excessive line rules.
- **Editorial Form Fields:** Label components leverage `label-md` with strict medium weights (`500`) directly above inputs, paired with `0.375rem` vertical separation.

## Layout & Spacing

The layout utilizes a structured 12-column responsive fluid grid designed around an 8px base rhythm.

### Breakpoints & Container Logic
- **Mobile (< 768px):** 4 fluid columns, `1rem` outer canvas margin, collapsible navigation drawer, stackable single-column cards and full-bleed tabular lists.
- **Tablet (768px - 1024px):** 8 fluid columns, `1.5rem` outer canvas margin, slim iconized rail sidebar (`4rem` width), 2-column KPI clusters.
- **Desktop (1024px+):** 12 fluid columns, `2rem` outer canvas margin, fixed persistent administrative sidebar (`16rem` width), maximum main container width capped at `88rem` (1408px).

### Spacing Principles
- Density is tailored to administrative needs: interior card padding uses `space-lg` (`1.5rem`) on desktop and `space-md` (`1rem`) on mobile.
- Form field stacks and inline filters maintain consistent `space-sm` (`0.5rem`) to `space-md` (`1rem`) inter-component gaps.

## Elevation & Depth

Visual depth is achieved through low-contrast physical tiers and ambient shadows, avoiding heavy drops or neon backdrops.

### Surface Elevation System
- **Level 0 (Canvas Base):** Background canvas rendered in `#F8FAFC`. Completely flat with no shadow.
- **Level 1 (Cards, Data Panels, Form Sections):** Surface rendered in `#FFFFFF`, framed with a 1px solid border in Slate 200 (`#E2E8F0`), supported by `shadow-sm`:
  - `box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.05);`
- **Level 2 (Dropdowns, Popovers, Filter Menus, Hovered Cards):** Surface rendered in `#FFFFFF`, 1px border in Slate 300 (`#CBD5E1`), supported by `shadow-md`:
  - `box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04);`
- **Level 3 (Modal Overlays, Confirmation Dialogs):** Centered floating dialogs framed with Slate 200 border, supported by a 40% opacity Slate 900 (`#0F172A66`) backdrop scrim and soft elevation:
  - `box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.06);`

## Shapes

The design system applies disciplined, subtle curvature to project structural authority and geometric order.

### Shape Hierarchy
- **Inputs & Action Items (`rounded-md` / 6px):** Form text fields, dropdown selectors, select menus, primary/secondary buttons, icon buttons, and pagination controls.
- **Structural Containers (`rounded-lg` / 8px):** Dashboard overview cards, data table wrappers, alerts, and inline drawers.
- **Elevated Modals & Dialogs (`rounded-xl` / 12px):** Centralized popups, financial batch modal dialogs, and large member profile preview overlays.
- **Status Indicators & Badges (`rounded-full` / 9999px):** Semantic status chips, notification count pills, and user avatar wrappers.

## Components

### Buttons
- **Primary:** Background `#1E40AF`, text `#FFFFFF`, border `transparent`, border-radius `6px`. Height `38px` (desktop) / `42px` (mobile). Hover state: `#2563EB`. Active state: `#1E3A8A`. Focus ring: 2px offset with `#2563EB`.
- **Secondary / Outline:** Background `#FFFFFF`, text `#0F172A`, border `1px solid #CBD5E1`, border-radius `6px`. Hover state: background `#F1F5F9`.
- **Destructive:** Background `#FEF2F2`, text `#B91C1C`, border `1px solid #FCA5A5`, border-radius `6px`. Hover state: background `#FEE2E2`.

### Inputs & Form Fields
- Height `38px`, padding `0.5rem 0.75rem`. Border `1px solid #CBD5E1`, background `#FFFFFF`, text `#0F172A`, placeholder `#94A3B8`, border-radius `6px`.
- **Focus:** Border color `#1E40AF`, box-shadow `0 0 0 1px #1E40AF`.
- **Error:** Border color `#EF4444`, focus ring `#EF4444`. Error label text in `#B91C1C` (`body-sm`) placed `4px` beneath input.

### Data Tables
- Header row styled with background `#F1F5F9`, border bottom `1px solid #E2E8F0`, typography `label-caps` in `#64748B`. Row height `40px`.
- Body rows styled with background `#FFFFFF`, border bottom `1px solid #F1F5F9`, row height `52px`, typography `body-md` in `#0F172A`. Hover state: `#F8FAFC`.
- Financial and numeric values right-aligned with monospace/tabular lining figures.

### Status Chips & Badges
- Height `24px`, padding `0 0.5rem`, border-radius `9999px`, typography `label-md` (`font-size: 0.75rem`).
- Composed of paired 50-tint backgrounds, 600-tint text, and matching subtle 1px border.

### Checkboxes & Radios
- Size `16px x 16px`. Checkbox corner radius `4px`, Radio corner radius `9999px`.
- Resting border `1px solid #CBD5E1`, checked state `#1E40AF` with pure white indicator icon.

### Cards
- Surface `#FFFFFF`, border `1px solid #E2E8F0`, border-radius `8px`, shadow `shadow-sm`.
- Inner content padding divided cleanly into Header (`1rem 1.5rem`, border bottom `1px solid #F1F5F9`), Body (`1.5rem`), and Footer (`0.75rem 1.5rem`, background `#F8FAFC`, border top `1px solid #F1F5F9`).

### Church-Specific Specialized Components
- **Tithe / Donation Summary KPI Card:** Large bold figure (`headline-lg`), tabular font, subtle indicator badge displaying % growth compared to the prior period, neutral auxiliary label.
- **Sacramental & Member Timeline:** Vertical line in `#E2E8F0` with 8px solid nodes representing milestones (Baptism, Confirmation, Marriage, Membership Transfer).
- **Attendance Bar:** Dual-tone progress bar (capacity vs. actual checked-in) using `#1E40AF` over `#E2E8F0` track with `rounded-full` boundaries.