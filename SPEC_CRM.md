# CRM Design & Feature Specification

This document serves as a comprehensive guide to the design system, components, and logic of the **TECHINFIGO CRM**. Use this to communicate the exact requirements to other AI assistants or developers to reproduce this CRM.

---

## 1. Visual Design & Theme

### Color Palette
- **Primary Base (Dark)**: `#001d21` (Used for backgrounds, premium accents)
- **Secondary Accent (Gold)**: `#fcb632` (Used for primary buttons, highlights, badges)
- **Background (Frosted)**: `rgba(0, 44, 51, 0.75)` with `backdrop-filter: blur(16px)`
- **Success/Positive**: `#16A34A`
- **Error/Negative**: `#DC2626`

### Typography
- **Primary Font**: `Poppins` (Imported from Google Fonts)
- **Fallback**: `Inter`, `sans-serif`
- **Headings**: Semibold/Bold with `tracking-tight`

### Layout Patterns
- **Sidebar**: Collapsible, dark theme (`#001d21`), active states highlighted in gold.
- **TopNavbar**: Clean with view-specific title, notification bell (with pulse animation), and user profile dropdown.
- **Glassmorphism**: Modals and Panels use a centered frosted glass effect with thin borders (`rgba(252, 182, 50, 0.2)`).

---

## 2. Shared Components (Core UI)

### Buttons
- **Primary**: Gold background (`#fcb632`), dark text (`#001d21`), subtle shadow. Scale effect on hover.
- **Outline**: Transparent background, gold border, gold text.
- **Motion**: All buttons use `motion` for `whileHover={{ scale: 1.02 }}` and `whileTap={{ scale: 0.98 }}`.

### Form Fields
- **Inputs**: Rounded corners (`12px`), dark semi-transparent bg, left-aligned icons (Lucide), focus rings in gold.
- **Labels**: Small, muted text above inputs.

---

## 3. Premium Interactive Components

### Google-Style Login Page
- **Mode 1 (New User)**: Shows "Sign In" title, logo, Email/Password fields.
- **Mode 2 (Return User)**: Detects `lastLoggedInUser` from `localStorage`. Shows:
  - Large centered Profile Picture circle (80x80px).
  - "Hi, [Name]" heading.
  - Email displayed in a pill-shaped button with a dropdown icon.
  - Password field auto-focused.
  - "Use another account" button to clear state.
- **Animations**: Uses `framer-motion` for smooth transitions between profile and login forms.

### Date & Range Pickers
- **DatePicker**: Custom calendar dropdown with frosted glass bg, year selector, "Today" and "Clear" buttons.
- **DateRangePicker**: Two-pane calendar view with a side panel for **Presets** (All Time, Today, Last 7 Days, etc.).
- **Entrance**: Animated with `motion` (scale up + fade in).

---

## 4. Complex Views & Logic

### Dashboard
- **Widget Grid**: Bento-style grid with metric cards, recent activity logs, and chart visualizations (using Chart.js).
- **Animations**: Staggered entrance for cards.

### SOP Library
- **Architecture**: Category-based filtering for internal processes.
- **Detail View**: Full-screen or modal display of steps with markdown support.

### Audit Module
- **Workflow**: Create Audit -> Logic Scoring -> Recommendation Engine -> PDF Export.
- **Scoring**: Range selection components with color-coded badges based on performance.

---

## 5. Technical Stack
- **Framework**: React 18+/19 with TypeScript.
- **State**: Zustand (for global data), `localStorage` (for persistence).
- **Styling**: Tailwind CSS v3+.
- **Animations**: `framer-motion` (via `motion/react`).
- **Icons**: `lucide-react`.

---

*Provide this specification along with the UI screenshots to Claude to get identical results.*
