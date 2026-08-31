## Styling System Overview

This repository uses a **hybrid component library approach** combining two distinct UI systems:

1. **shadcn/ui (New York style)** — Provides foundational UI primitives (Button, Input, Dialog, Sidebar, etc.) built on Radix UI primitives with Tailwind CSS.
2. **HeroUI (formerly NextUI) v2** — Supplies richer interactive components (Modal, Dropdown, Table, DatePicker, Toast, Tabs, Chip, Skeleton, Pagination, Alert, Kbd, Spinner).

Both libraries are unified under **Tailwind CSS v4** with the new `@tailwindcss/postcss` plugin architecture.

---

## Core Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| CSS Framework | Tailwind CSS v4 | Utility-first styling with `@theme inline` custom properties |
| PostCSS Plugin | `@tailwindcss/postcss` | Tailwind v4's new build pipeline |
| Animation Utilities | `tw-animate-css` | Pre-built animation utility classes |
| Component Library A | shadcn/ui (New York style) | Accessible primitives via Radix UI |
| Component Library B | HeroUI (@heroui/react + individual packages) | Rich interactive components with built-in animations |
| Class Merging | `tailwind-merge` + `clsx` | Conflict-free class composition via `cn()` helper |
| Variant Management | `class-variance-authority` (CVA) | Typed variant props for component polymorphism |
| Color System | OKLCH color space | Perceptually uniform colors in CSS custom properties |
| Typography | Google Fonts (Outfit) | Single typeface via `next/font/google` |
| Dark Mode | Class-based (`dark:` variant) | Toggled via `.dark` class on parent elements |
| Motion | Framer Motion | Animation support (used by HeroUI internally) |

---

## Key Files

### Configuration
- **`tailwind.config.js`** — Minimal config; imports `heroui` theme plugin, declares content paths for HeroUI component styles, enables class-based dark mode.
- **`postcss.config.mjs`** — Registers `@tailwindcss/postcss` as the sole PostCSS plugin (Tailwind v4 pattern).
- **`components.json`** — shadcn/ui configuration: New York style, RSC-enabled, TypeScript, Lucide icons, `slate` base color, CSS variables enabled.

### Global Styles
- **`src/app/globals.css`** — Central stylesheet defining:
  - Tailwind v4 imports (`@import "tailwindcss"`, `@import "tw-animate-css"`)
  - Custom `@theme inline` block mapping CSS custom properties to Tailwind utility names (e.g., `--color-background`, `--color-primary`, `--radius-*`)
  - `:root` and `.dark` scopes with full OKLCH design token definitions covering: background, foreground, card, popover, primary, secondary, muted, accent, destructive, border, input, ring, chart colors (1–5), and sidebar-specific tokens
  - Base layer applying default font family (Outfit), border, and outline styles
  - Utility layer hiding number input spin buttons across browsers

### Utility Functions
- **`src/lib/utils.ts`** — Exports `cn()` helper combining `clsx` and `tailwind-merge` for safe class composition.

### Providers
- **`src/app/providers.tsx`** — Client-side provider wrapping the app with `HeroUIProvider` and `ToastProvider` (top-right placement).
- **`src/app/layout.tsx`** — Root layout applying Outfit font variable, `NextTopLoader` with OKLCH-colored progress bar, and the `Providers` wrapper.

### UI Components (shadcn/ui)
Located in `src/components/ui/`:
- `button.tsx` — CVA-based variants: default, destructive, outline, secondary, ghost, link; sizes: default, sm, lg, icon, icon-sm, icon-lg
- `input.tsx` — Standardized input with focus-visible ring, aria-invalid states, file upload support
- `dialog.tsx`, `dropdown-menu.tsx`, `sidebar.tsx`, `separator.tsx`, `tabs.tsx`, `tooltip.tsx`, `collapsible.tsx`, `avatar.tsx`, `skeleton.tsx`, `confirm-modal.tsx`, `formatted-number-input.tsx`

---

## Architecture & Conventions

### Hybrid Library Strategy
The codebase strategically splits component responsibilities:
- **shadcn/ui** handles structural/layout components (Sidebar, Dialog, Dropdown, Separator) and form primitives (Button, Input)
- **HeroUI** handles data-dense interactive components (Table, Pagination, DatePicker, Select, Tabs, Chip, Toast, Modal, Skeleton, Spinner, Alert, Kbd, Divider)

This is evident in pages like `finance/jurnal/page.tsx` and `inventory/in/create/page.tsx` which import from both `@heroui/react` and `@/components/ui/*`.

### Design Token System
All colors use **OKLCH color space** for perceptual uniformity. The token hierarchy includes:
- **Semantic tokens**: `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`
- **Functional tokens**: `border`, `input`, `ring`
- **Chart tokens**: `chart-1` through `chart-5` for data visualization
- **Sidebar-specific tokens**: `sidebar`, `sidebar-foreground`, `sidebar-primary`, `sidebar-accent`, `sidebar-border`, `sidebar-ring` (each with `-foreground` variants)
- **Radius scale**: `sm` through `4xl` derived from base `--radius: 0.625rem`

### Dark Mode Implementation
Dark mode uses class-based toggling (`.dark` parent class). Each semantic token has explicit light and dark values defined in `:root` and `.dark` blocks respectively. The `darkMode: "class"` setting in `tailwind.config.js` enables the `dark:` variant.

### Component Styling Pattern
shadcn/ui components follow this pattern:
```tsx
const componentVariants = cva("base-classes", {
  variants: { variant: {...}, size: {...} },
  defaultVariants: { variant: "default", size: "default" }
});
function Component({ className, variant, size, ...props }) {
  return <Comp className={cn(componentVariants({ variant, size, className }))} {...props} />
}
```

### Layout Structure
- Root layout (`src/app/layout.tsx`) applies font, top loader, and providers
- Authenticated layout (`src/app/(LoggedIn)/layout.tsx`) wraps content with `SidebarProvider`, header with search/notifications/user menu, and max-width constrained content area
- Route group `(LoggedIn)` isolates authenticated routes with shared layout

---

## Developer Rules

1. **Use `cn()` for all class composition** — Never concatenate class strings manually; always use `cn(className, otherClasses)` from `@/lib/utils` to ensure Tailwind class conflict resolution.

2. **Prefer shadcn/ui for structural components** — Use `@/components/ui/*` for Button, Input, Dialog, Sidebar, Dropdown, Separator, Tabs, Tooltip. These provide consistent Radix-based accessibility.

3. **Use HeroUI for data-rich components** — Use `@heroui/react` or individual `@heroui/*` packages for Table, Pagination, DatePicker, Select, Chip, Toast, Modal, Skeleton, Spinner, Alert, Kbd, Divider.

4. **Reference design tokens via Tailwind utilities** — Use `bg-background`, `text-foreground`, `border-border`, `ring-ring`, etc. rather than hardcoding colors. For custom CSS, reference CSS variables like `var(--background)`.

5. **Follow CVA pattern for new components** — Define variants using `cva()` from `class-variance-authority` with typed `VariantProps`.

6. **Maintain dark mode compatibility** — All new components must render correctly in both light and dark modes. Test with `.dark` class applied.

7. **Use OKLCH for any custom colors** — If adding new design tokens, use OKLCH format for perceptual consistency.

8. **Import HeroUI components individually when possible** — Prefer `import { Button } from "@heroui/button"` over `import { Button } from "@heroui/react"` for better tree-shaking, unless multiple components are needed.

9. **Apply Outfit font consistently** — The global font is set via CSS custom property `--font-outfit`; do not override font-family in components unless specifically required.

10. **Use radius tokens for consistency** — Reference `rounded-md`, `rounded-lg`, etc. which map to the defined radius scale rather than arbitrary values.