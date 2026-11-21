# CIVICRESOLVE_DESIGN_SYSTEM.md — CivicResolve Design System & UI Specification

**Brand:** CivicResolve  
**Tagline:** *Your City. Your Voice. Your Resolve.*  
**Philosophy:** CivicLens forensic reference aesthetic: High-authority Deep Municipal Navy (`#0F2854`) paired with Vibrant Saffron Orange (`#F97316` / `#EA580C`) action indicators. Clean, authoritative, accessible, and high-performance.

---

## 1. Brand Tokens & Color Palette (CivicLens Forensic Alignment)

### 1.1 Core Brand Colors
| Token | Hex Code | HSL / RGB | Intended Application |
|---|---|---|---|
| `--color-brand-primary` | `#0F2854` | `rgb(15, 40, 84)` | Primary buttons, headers, active nav indicators, municipal identity |
| `--color-brand-secondary` | `#1C4D8D` | `rgb(28, 77, 141)` | Secondary headers, hover highlights, royal blue card accents |
| `--color-brand-deep` | `#0B132B` | `rgb(11, 19, 43)` | Midnight dark header/footer bar, high-contrast dark sections |
| `--color-brand-tint` | `#F0F4F8` | `rgb(240, 244, 248)` | Light slate/blue tinted containers, table hover rows, active tab pills |

### 1.2 Action & Accent Tokens (Vibrant Saffron Orange)
| Token | Hex Code | Purpose |
|---|---|---|
| `--color-accent-primary` | `#F97316` | Saffron Orange CTA buttons, "Report Issue", urgent badges |
| `--color-accent-dark` | `#EA580C` | Button hover/active states, map pin anchor dot |
| `--color-accent-light` | `#FB923C` | Glow indicators, live pulse borders |

### 1.3 Surface & Neutral Canvas
| Token | Hex Code | Purpose |
|---|---|---|
| `--color-bg-base` | `#F8FAFC` | Slate-50 restful background canvas |
| `--color-surface-white` | `#FFFFFF` | Card surfaces, modal sheets, input controls, table rows |
| `--color-surface-subtle` | `#F1F5F9` | Secondary containers, timeline track backgrounds, code blocks |
| `--color-border-subtle` | `#E2E8F0` | Slate-200 clean 1px card borders, table dividers, navbar border |
| `--color-border-focus` | `#0F2854` | Active input ring with `rgba(15, 40, 84, 0.2)` shadow |

### 1.4 Grievance Priority Tokens
| Priority Level | Background | Border | Text | Lucide Icon |
|---|---|---|---|---|
| **Critical** | `#FEF2F2` (Red 50) | `#FECACA` (Red 200) | `#DC2626` (Red 600) | `AlertOctagon` |
| **High** | `#FFF7ED` (Orange 50) | `#FFEDD5` (Orange 200) | `#EA580C` (Orange 600) | `Flame` |
| **Medium** | `#FFFBEB` (Amber 50) | `#FDE68A` (Amber 200) | `#D97706` (Amber 600) | `AlertTriangle` |
| **Low** | `#ECFDF5` (Emerald 50) | `#A7F3D0` (Emerald 200) | `#059669` (Emerald 600) | `CheckCircle2` |

### 1.5 Municipal Status Lifecycle Tokens
- `SUBMITTED`: Blue pill (`bg-blue-50 text-blue-800 border-blue-200`)
- `AI_ANALYSED`: Purple pill (`bg-purple-50 text-purple-800 border-purple-200`)
- `UNDER_REVIEW`: Amber pill (`bg-amber-50 text-amber-800 border-amber-200`)
- `ASSIGNED`: Indigo pill (`bg-indigo-50 text-indigo-800 border-indigo-200`)
- `IN_PROGRESS`: Blue/Amber pill (`bg-amber-50 text-amber-800 border-amber-200`)
- `RESOLVED`: Emerald pill (`bg-emerald-50 text-emerald-800 border-emerald-200`)
- `CITIZEN_VERIFIED`: Deep Blue pill (`bg-blue-50 text-[#0F2854] border-blue-300`)
- `REJECTED`: Slate pill (`bg-slate-100 text-slate-800 border-slate-300`)

---

## 2. Typography Specification

Font Family: `Inter`, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif.

| Level | Size (Desktop) | Size (Mobile) | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|---|
| **Hero Display** | 48px (3.0rem) | 32px (2.0rem) | 800 (Extrabold) | 1.12 | -0.025em |
| **Page Title (H1)** | 32px (2.0rem) | 24px (1.5rem) | 700 (Bold) | 1.25 | -0.02em |
| **Section Header (H2)** | 24px (1.5rem) | 20px (1.25rem) | 700 (Bold) | 1.3 | -0.015em |
| **Card Header (H3)** | 18px (1.125rem) | 16px (1.0rem) | 600 (Semibold) | 1.4 | -0.01em |
| **Subheading (H4)** | 15px (0.9375rem) | 14px (0.875rem) | 600 (Semibold) | 1.45 | 0 |
| **Body (Default)** | 14px (0.875rem) | 14px (0.875rem) | 400 (Regular) | 1.5 | 0 |
| **Small / Meta** | 12px (0.75rem) | 11px (0.6875rem) | 500 (Medium) | 1.4 | 0.01em |
| **Mono / Public IDs** | 12px (0.75rem) | 11px (0.6875rem) | 700 (Bold) | 1.0 | 0.05em (Monospace) |

---

## 3. Elevation, Spacing & Container Radii

### 3.1 Shadows & Elevation
- **`shadow-card`**: `0 1px 3px rgba(15,40,84,0.06), 0 1px 2px rgba(15,40,84,0.04)` (Restful cards)
- **`shadow-card-hover`**: `0 10px 20px -3px rgba(15,40,84,0.12), 0 4px 6px -2px rgba(15,40,84,0.05)` (Hover elevation)
- **`shadow-modal`**: `0 20px 25px -5px rgba(15,40,84,0.15), 0 10px 10px -5px rgba(15,40,84,0.06)` (Dialogs & overlays)

### 3.2 Corner Radii
- **`rounded-lg` (8px):** Buttons, input controls, action pills
- **`rounded-xl` (12px):** Secondary cards, category selectors, image preview containers
- **`rounded-2xl` (16px):** Primary cards, modals, hero banners, map frame
- **`rounded-full` (9999px):** Status badges, avatar circles, icon circular backdrops
