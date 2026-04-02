# Kanan Labs Design System

A detailed guide to the aesthetic vibe, colors, fonts, and visual elements of the India AI Tracker platform.

---

## 1. Color Palette

### Brand Colors
- **Brand Navy** (Primary Background): `#0a2f52`
- **Brand Cream** (Accent/Highlight): `#F4EBD0`

### Text Colors
- **Text Primary** (Main text): `#1C1C1E` (Charcoal, not pure black)
- **Text Secondary** (Secondary text): `#4A4A4C`
- **Text Tertiary** (Tertiary/muted text): `#6B6B6E`

### Accent Colors
- **Accent Primary** (Deep navy for interactive elements): `#142166`
- **Accent Primary Light** (Light version with transparency): `rgba(20, 33, 102, 0.1)`
- **Accent Amber** (Highlights and borders): `#B45309`
- **Accent Amber Light** (Light amber with transparency): `rgba(180, 83, 9, 0.15)`

### Background Colors
- **Background Primary** (Main content background): `#FFFFFF`
- **Background Secondary** (Secondary elements): `#F8F9FA`
- **Background Tertiary** (Tertiary elements): `#F1F3F5`
- **Page Background** (Full page background): `#0a2f52` (Same as Brand Navy)

### Component-Specific Colors
- **Frame Border** (Map frame and containers): `rgba(244, 235, 208, 0.1)` (Cream with transparency)
- **Frame Shadow** (Depth for frames): `rgba(0, 0, 0, 0.25)`
- **Map Fill** (Interactive map states): `#4A90E2` (Bright blue)
- **Map Fill Hover**: `#3A7BC8` (Darker blue)
- **Map Border**: `#2C3E50` (Darker navy)

---

## 2. Typography

### Font Families

#### Primary Display Font (Decorative)
- **Font**: Cormorant Garamond
- **Usage**: Large headings, section titles, brand statements
- **Weights**: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)
- **Style**: Serif, elegant, sophisticated
- **File**: Located in `assets/fonts/CormorantGaramond-*.ttf`

#### Utility/Uppercase Font
- **Font**: Telegraf
- **Usage**: Section labels, metadata, small uppercase text
- **Weight**: 400 (Regular)
- **Style**: Monospace, modern, technical
- **File**: Located in `assets/fonts/Telegraf-Regular.otf`

#### Secondary Display Font
- **Font**: Playfair Display
- **Usage**: Headers, titles (serif alternative)
- **Weights**: 400 (Regular), 600 (SemiBold), 700 (Bold)
- **Imported from**: Google Fonts

#### Body Font
- **Font**: Inter
- **Usage**: Body text, UI elements, general content
- **Weights**: 300 (Light), 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)
- **Imported from**: Google Fonts
- **Fallback**: -apple-system, BlinkMacSystemFont, sans-serif

### Typography Hierarchy

#### Large Section Titles
- **Font**: Six Caps (alternative) or Cormorant Garamond
- **Size**: Responsive, `clamp(5rem, 7.5vw, 7.5rem)`
- **Weight**: 400–600
- **Text Transform**: UPPERCASE
- **Letter Spacing**: 0.02em
- **Line Height**: 0.9

#### Medium Section Headers
- **Font**: Cormorant Garamond
- **Weight**: 600–700
- **Size**: 2rem–3rem

#### Standard Headers (H1–H3)
- **Font**: Inter
- **Weight**: 600–700
- **Size**: 1.25rem–2rem

#### Body Text
- **Font**: Inter
- **Weight**: 400
- **Size**: 0.95rem–1rem
- **Line Height**: 1.6

#### Small/Meta Text
- **Font**: Telegraf or Inter
- **Weight**: 400–700
- **Size**: 0.6875rem–0.875rem
- **Text Transform**: Often UPPERCASE
- **Letter Spacing**: 0.15em

---

## 3. Spacing & Layout

### Padding & Margins
- **Section Padding**: 3rem (2rem on mobile)
- **Container Max Width**: 1280–1400px
- **Horizontal Padding (Container)**: 2rem (standard), 4rem (footer)
- **Gap/Column Spacing**: 80px (large), 0–3rem (varies by section)
- **Vertical Spacing**: 1.75rem–3rem between sections

### Grid Systems
- **Platform Split**: 55% left (cards/text) / 45% right (video/image)
- **Footer Grid**: 260px brand zone / 1fr sitemap
- **Bento Grid**: Dynamic 3–4 column layout (adapts to viewport)

### Border Radius
- **Standard Radius**: 12px (frame-radius CSS variable)
- **Interactive Elements**: 8px

---

## 4. Visual Effects & Animations

### Shadows
- **Standard Shadow**: `0 2px 20px rgba(41, 53, 60, 0.15)`
- **Button Hover**: `0 6px 20px rgba(170, 199, 216, 0.4)`
- **Frame Shadow**: `rgba(0, 0, 0, 0.25)`

### Transitions & Animations
- **Duration**: 450ms (CSS variable: `--transition-duration`)
- **Easing**: `cubic-bezier(0.22, 1, 0.36, 1)` (custom ease-out)
- **Standard**: `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`

### Special Effects
- **Shiny Text**: Gradient animation with moving highlights (cream/white shimmer)
- **Infrastructure Grid**: Fixed canvas background (navy grid pattern)
- **Scroll Reveal**: ScrollTrigger animations on section entry
- **Mix Blend Mode**: Used for layering effects over backgrounds

### Button States
- **Default**: Accent color background with text
- **Hover**: Lighter shade + upward transform (-2px)
- **Active**: Darker shade + enhanced shadow

---

## 5. Components & Elements

### Buttons
- **Primary Button**:
  - Background: Accent (navy or amber depending on context)
  - Padding: 0.875rem 1.75rem
  - Font Size: 0.95rem
  - Font Weight: 600
  - Border Radius: 8px
  - Box Shadow: 0 4px 12px with accent color transparency

### Cards/Containers
- **Background**: White or secondary light color
- **Border Radius**: 12px
- **Padding**: 1.5rem–3rem (varies)
- **Border**: Sometimes 1px with frame-border color
- **Shadow**: Subtle box-shadow for depth

### Input Fields
- **Background**: White (`#FFFFFF`)
- **Border**: 1px solid accent color or light gray
- **Padding**: 0.75rem–1rem
- **Border Radius**: 8px

### Footer
- **Background**: Brand Navy (`#0a2f52`)
- **Text Color**: White with opacity (0.72 for body, 0.38 for labels)
- **Font**: Cormorant Garamond (tagline), Telegraf (labels)

---

## 6. Page Structure & Layout

### Header/Navigation
- **Background**: Brand Navy (`#0a2f52`)
- **Height**: 48px (institutional header)
- **Z-Index**: 101 (persistent over content)
- **Padding**: 0 2rem
- **Logo Size**: 52px (height)

### Hero Section
- **Background**: Brand Navy with grid overlay
- **Content**: Large title + controls/toggles
- **Font**: Playfair Display for h1 (serif, elegant)

### Main Container
- **Max Width**: Responsive, typically 1280–1400px
- **Margin**: 0 auto (centered)
- **Padding**: 2rem–4rem horizontal

### Footer
- **Padding**: 120px top, 16px bottom for content
- **Layout**: 260px brand zone + 1fr sitemap grid
- **Gap**: 80px between sections

---

## 7. Responsive Design Principles

### Breakpoints (Implicit)
- **Desktop**: Full layout, max-width containers
- **Tablet**: Adjusted padding, single-column sections
- **Mobile**: Stacked layout, reduced padding (2rem), single columns

### Fluid Typography
- Uses `clamp()` for responsive font sizes
- Example: `clamp(5rem, 7.5vw, 7.5rem)` scales between viewport size

### Mobile-First Adjustments
- Section padding: 3rem → 2rem
- Split layouts become single column
- Toggle controls appear for view switching
- Maps and videos scale to viewport

---

## 8. Key Visual Characteristics

### Overall Aesthetic
- **Theme**: Modern, professional, tech-forward
- **Vibe**: Clean, sophisticated, data-driven with organic touches
- **Mood**: Corporate intelligence meets elegant design
- **Accessibility**: High contrast text, clear hierarchy, intuitive layout

### Design Language
- **Minimalist headers** with large typography
- **Generous whitespace** for readability
- **Subtle animations** for micro-interactions
- **Navy + cream** brand accent throughout
- **Soft shadows** for depth without heaviness
- **Grid-based** layout with organic element placement

### Key Influences
- Serif fonts (Cormorant Garamond) for brand prestige
- Sans-serif (Inter) for modern readability
- Technical font (Telegraf) for utility/data context
- Dark navy background suggests trustworthiness and sophistication
- Cream accents provide warmth and approachability

---

## 9. Implementation Notes

### CSS Variables Usage
All colors, transitions, and sizes are stored as CSS variables in `:root`:
```css
:root {
    --brand-navy: #0a2f52;
    --brand-cream: #F4EBD0;
    --text-primary: #1C1C1E;
    --accent-primary: #142166;
    --transition-duration: 450ms;
    --transition-easing: cubic-bezier(0.22, 1, 0.36, 1);
    /* ...more variables... */
}
```

### Font Loading
- Google Fonts: Inter, Playfair Display (hosted)
- Custom Fonts: Cormorant Garamond, Telegraf (local files in `assets/fonts/`)
- Font Display: `swap` for optimal rendering

### Background Grid
- Fixed canvas element (`#infrastructure-grid`)
- Positioned: `fixed; top: 0; left: 0; z-index: 0`
- Pointer events: `none` (non-interactive)
- Navy color to match brand

---

## 10. Quick Reference for New Pages

When creating a new page matching this design:

1. **Include CSS files**:
   - `css/styles-v2.css` (core styles, colors, typography)
   - `css/footer.css` (footer styling)
   - Component-specific CSS files as needed

2. **Use these font families**:
   - Display: Cormorant Garamond
   - Body: Inter
   - Utility: Telegraf

3. **Color codes**:
   - Background: `#0a2f52` (navy)
   - Accents: `#F4EBD0` (cream), `#B45309` (amber)
   - Text: `#1C1C1E` (primary)

4. **Spacing**:
   - Section padding: 3rem
   - Container max-width: 1280–1400px
   - Gap between columns: 80px (large sections)

5. **Animations**:
   - Transition duration: 450ms
   - Easing: `cubic-bezier(0.22, 1, 0.36, 1)`

6. **Structure**:
   - Institutional header (fixed, 48px)
   - Main content area (centered, max-width container)
   - Kanan Labs footer (persistent)

---

**Last Updated**: March 2026
**Version**: 1.0
