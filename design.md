# Paylo — Enterprise Design System

> **Product:** Paylo  
> **Category:** POS / Cashier Application  
> **Design Direction:** Enterprise · Professional · Modern · Trustworthy  
> **Primary Audience:** Retailers, F&B businesses, SMEs, multi-outlet operators, and enterprise teams

---

## 1. Brand Design Principle

Paylo should feel like a **serious business infrastructure product**, not a generic cashier app.

### Brand attributes

- **Professional** — clean hierarchy, precise spacing, restrained visual language.
- **Reliable** — interfaces communicate stability, clarity, and operational confidence.
- **Efficient** — users can complete cashier tasks with minimal cognitive load.
- **Scalable** — visual language must work for one store and multi-outlet enterprises.
- **Modern** — contemporary SaaS aesthetics without excessive gradients, glassmorphism, or decoration.

### Design keywords

`Enterprise SaaS` · `Fintech-inspired clarity` · `Operational efficiency` · `Data-driven` · `Premium B2B`

---

# 2. Visual Identity

## 2.1 Color System

Use a neutral-first interface with one strong brand accent.

### Brand

| Token | Hex | Usage |
|---|---|---|
| `--paylo-primary-700` | `#155EEF` | Primary actions, active states |
| `--paylo-primary-600` | `#2563EB` | Main brand color |
| `--paylo-primary-500` | `#3B82F6` | Hover / secondary emphasis |
| `--paylo-primary-100` | `#DBEAFE` | Soft backgrounds |
| `--paylo-primary-50` | `#EFF6FF` | Subtle surfaces |

### Neutral

| Token | Hex | Usage |
|---|---|---|
| `--gray-950` | `#101828` | Primary text |
| `--gray-800` | `#1D2939` | Strong text |
| `--gray-600` | `#475467` | Secondary text |
| `--gray-500` | `#667085` | Placeholder / muted |
| `--gray-300` | `#D0D5DD` | Borders |
| `--gray-200` | `#EAECF0` | Dividers |
| `--gray-100` | `#F2F4F7` | Secondary surfaces |
| `--gray-50` | `#F9FAFB` | Page backgrounds |
| `--white` | `#FFFFFF` | Cards / primary surfaces |

### Semantic

| Token | Hex | Usage |
|---|---|---|
| `--success-600` | `#039855` | Successful transactions |
| `--warning-600` | `#DC6803` | Warnings |
| `--error-600` | `#D92D20` | Errors / failed transactions |
| `--info-600` | `#1570EF` | Informational states |

**Rule:** Do not use semantic colors as decoration. Every color must communicate meaning.

---

# 3. Typography

## Primary Typeface

**Inter**

Fallback:

`Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

### Type scale

| Style | Size | Weight | Line Height |
|---|---:|---:|---:|
| Display | 36px | 700 | 44px |
| H1 | 30px | 700 | 38px |
| H2 | 24px | 700 | 32px |
| H3 | 20px | 600 | 28px |
| Body Large | 16px | 400 | 24px |
| Body | 14px | 400 | 20px |
| Body Medium | 14px | 500 | 20px |
| Caption | 12px | 400 | 18px |
| Label | 12px | 600 | 18px |

### Typography rules

- Use sentence case.
- Avoid excessive uppercase text.
- Use `600` for labels and UI emphasis.
- Use `700` only for headings and important numeric summaries.
- Financial values should use tabular numerals where available.

---

# 4. Layout System

## Spacing

Base unit: **4px**

Recommended scale:

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64`

### Enterprise application layout

```text
┌───────────────────────────────────────────────────────────────┐
│ Top Bar                                                       │
├───────────────┬───────────────────────────────────────────────┤
│               │                                               │
│ Sidebar       │ Main Content                                  │
│               │                                               │
│ Navigation    │ Page Header                                   │
│               │                                               │
│               │ Content / Tables / Cards                      │
│               │                                               │
└───────────────┴───────────────────────────────────────────────┘
```

### Recommended dimensions

- Sidebar: `240px`
- Compact sidebar: `72px`
- Top bar: `64px`
- Main content max-width: `1440px`
- Page horizontal padding: `32px`
- Card radius: `12px`
- Button radius: `8px`
- Input radius: `8px`

---

# 5. Design Tokens

```css
:root {
  --color-primary: #2563EB;
  --color-primary-hover: #155EEF;
  --color-primary-soft: #EFF6FF;

  --color-text: #101828;
  --color-text-secondary: #475467;
  --color-text-muted: #667085;

  --color-border: #EAECF0;
  --color-border-strong: #D0D5DD;

  --color-background: #F9FAFB;
  --color-surface: #FFFFFF;

  --color-success: #039855;
  --color-warning: #DC6803;
  --color-error: #D92D20;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  --shadow-sm: 0 1px 2px rgba(16, 24, 40, 0.05);
  --shadow-md: 0 4px 12px rgba(16, 24, 40, 0.08);

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
}
```

---

# 6. Navigation

## Sidebar

Primary navigation:

1. Dashboard
2. Transactions
3. Products
4. Inventory
5. Customers
6. Reports
7. Employees
8. Outlets
9. Integrations
10. Settings

### Sidebar behavior

- Active item uses primary blue background at low opacity.
- Icon + label are always aligned.
- Avoid more than 10 primary navigation items.
- Secondary actions belong at the bottom.
- User profile appears in the lower navigation area.

Example:

```text
┌────────────────────────┐
│ PAYLO                  │
│                        │
│ ▣ Dashboard             │
│ ◫ Transactions          │
│ □ Products              │
│ ▤ Inventory             │
│ ♙ Customers             │
│ ◉ Reports               │
│ ◌ Employees             │
│ ⌖ Outlets               │
│ ↔ Integrations          │
│                        │
│ ─────────────────────  │
│ ⚙ Settings              │
│ 👤 Admin Account        │
└────────────────────────┘
```

---

# 7. Dashboard Design

Dashboard should answer four questions immediately:

1. How much did the business sell?
2. How is today's performance compared to previous periods?
3. What needs attention?
4. Which operational areas require action?

## Dashboard structure

```text
Page Header
├── Business / Outlet selector
├── Date range
└── Export / Action

KPI Row
├── Total Sales
├── Transactions
├── Average Order Value
└── Net Revenue

Analytics
├── Sales Overview Chart
└── Sales by Payment Method

Operations
├── Low Stock
├── Recent Transactions
└── Top Products
```

### KPI card

```text
┌──────────────────────────────┐
│ Total Sales          ⋯       │
│                              │
│ Rp 128.450.000               │
│ ↑ 12.8% vs last period       │
└──────────────────────────────┘
```

Rules:

- Primary metric: 24–28px / 700.
- Label: 12–14px / 500.
- Comparison: 12–14px.
- Keep KPI cards visually equal.
- Do not overload cards with charts.

---

# 8. POS / Cashier Screen

The cashier interface is the most operationally critical screen.

## Design objective

**Speed + accuracy + visibility**

```text
┌───────────────────────────────────────────────────────────────┐
│ Paylo POS                                  Outlet · Cashier   │
├───────────────────────────────┬───────────────────────────────┤
│ Search product...             │ Current Order                 │
│                               │                               │
│ Categories                   │ Product A        2 × 25.000   │
│ [All] [Food] [Drink] [Other] │ Product B        1 × 40.000   │
│                               │                               │
│ Product Grid                  │ ────────────────────────────  │
│ ┌──────┐ ┌──────┐ ┌──────┐   │ Subtotal          Rp 90.000   │
│ │ Item │ │ Item │ │ Item │   │ Discount          Rp 10.000   │
│ └──────┘ └──────┘ └──────┘   │ Total             Rp 80.000   │
│                               │                               │
│                               │ [Charge Customer]             │
└───────────────────────────────┴───────────────────────────────┘
```

### POS rules

- Product search must be prominent.
- Cart must remain visible.
- Total must always be visible.
- Primary checkout action must have strong visual hierarchy.
- Use keyboard shortcuts where appropriate.
- Confirmation dialogs should be reserved for destructive or irreversible actions.
- Avoid unnecessary animation during checkout.

---

# 9. Tables

Enterprise users often manage hundreds or thousands of records.

### Table principles

- Sticky header.
- Clear column hierarchy.
- Right-align numerical values.
- Use pagination.
- Support search and filters.
- Use row actions instead of excessive buttons.
- Allow column sorting.
- Keep density compact but readable.

Example:

```text
Transactions

[Search transactions...] [Filter] [Date] [Export]

┌──────────┬──────────────┬──────────┬────────────┬─────────────┐
│ ID       │ Customer     │ Amount   │ Status     │ Action      │
├──────────┼──────────────┼──────────┼────────────┼─────────────┤
│ #INV1023 │ Andi         │ Rp 85k   │ Paid       │ View ›      │
│ #INV1022 │ Budi         │ Rp 120k  │ Paid       │ View ›      │
│ #INV1021 │ Sinta        │ Rp 45k   │ Refunded   │ View ›      │
└──────────┴──────────────┴──────────┴────────────┴─────────────┘
```

---

# 10. Buttons

## Primary

```text
[ + Add Product ]
```

- Background: Primary 600
- Text: White
- Height: 40px
- Radius: 8px

## Secondary

```text
[ Export ]
```

- Background: White
- Border: Gray 300
- Text: Gray 800

## Destructive

```text
[ Delete Product ]
```

- Use Error 600.
- Never use red for normal actions.

### Button hierarchy

Maximum recommended hierarchy per screen:

1. One primary action.
2. Secondary supporting actions.
3. Tertiary / text actions.

---

# 11. Forms

Forms should feel structured and predictable.

```text
Product Information

Product Name
[ Coca Cola 330ml                         ]

Category
[ Beverage                         ▼ ]

Selling Price
[ Rp 10.000                              ]

Stock
[ 120                                    ]

                    [ Cancel ] [ Save Product ]
```

Rules:

- Labels above fields.
- Helper text below fields.
- Error messages immediately below the affected field.
- Never rely on placeholder text as the label.
- Use consistent field heights: `40–44px`.

---

# 12. Status System

Use status badges consistently.

```text
[ PAID ]
[ PENDING ]
[ REFUNDED ]
[ CANCELLED ]
[ LOW STOCK ]
[ ACTIVE ]
[ INACTIVE ]
```

Status should combine **text + visual distinction**, never color alone.

---

# 13. Cards

Cards are for grouping related information, not for every piece of content.

Recommended:

- Background: White
- Border: `#EAECF0`
- Radius: 12px
- Padding: 20–24px
- Shadow: minimal

Avoid:

- Heavy shadows
- Large gradients
- Excessive rounded containers
- Decorative illustrations inside operational screens

---

# 14. Data Visualization

Paylo analytics should feel analytical and trustworthy.

### Recommended charts

- Line chart → sales trends
- Bar chart → product / outlet comparison
- Donut chart → payment method distribution
- Horizontal bar → top products
- Area chart → revenue trend when appropriate

### Chart rules

- Prioritize labels and values.
- Keep grid lines subtle.
- Avoid 3D charts.
- Avoid excessive colors.
- Use the brand color as the default series.
- Use semantic colors only when the data has semantic meaning.

---

# 15. Responsive Design

### Desktop

Primary experience for:

- Admin dashboard
- Inventory
- Reports
- Multi-outlet management

### Tablet

Primary experience for:

- POS
- Inventory
- Transaction management

### Mobile

Focus on:

- Sales overview
- Notifications
- Transaction lookup
- Approvals
- Quick operational actions

Do not simply shrink desktop layouts. Reprioritize information.

---

# 16. Empty States

Empty states should explain the next action.

```text
No products yet

Add your first product to start managing
your catalog and inventory.

[ + Add Product ]
```

Avoid generic:

`No data found.`

---

# 17. Loading States

Use skeletons for:

- Dashboard cards
- Tables
- Charts
- Product grids

Avoid full-screen spinners unless the entire application is loading.

---

# 18. Error Handling

Error messages should be:

- Specific
- Human-readable
- Actionable

Bad:

`Error 500`

Better:

`We couldn't complete the transaction. Check your connection and try again.`

For financial transactions, always preserve transaction state and clearly indicate whether payment was completed, pending, or failed.

---

# 19. Accessibility

Target **WCAG 2.2 AA**.

Requirements:

- Minimum accessible contrast.
- Keyboard navigation.
- Visible focus states.
- Form labels.
- Screen-reader-friendly controls.
- Do not communicate state through color alone.
- Touch targets should be sufficiently large.
- Use semantic HTML where applicable.

---

# 20. Motion

Motion should communicate system state, not decorate the UI.

Recommended:

- 150–200ms for micro-interactions.
- 200–300ms for panels and modals.
- Ease-out for entering elements.
- Ease-in for exiting elements.

Avoid:

- Excessive bouncing.
- Long transitions.
- Animated dashboards.
- Motion during checkout that delays action.

---

# 21. Iconography

Use a consistent outline icon family.

Recommended style:

- 20px default UI icons.
- 16px compact icons.
- 24px prominent actions.
- Stroke-based.
- Avoid mixing filled and outline icon styles without purpose.

Icon libraries should remain consistent across the product.

---

# 22. Brand Logo Usage

The Paylo logo should have:

- Full-color version for light backgrounds.
- White version for dark backgrounds.
- Monochrome version for constrained contexts.

Minimum clear space:

`1× logo mark height` around the logo.

Never:

- Stretch the logo.
- Add arbitrary shadows.
- Change logo colors.
- Place the logo over visually noisy backgrounds.

---

# 23. Landing Page Direction

Paylo's marketing website should communicate:

**"The operating system for modern commerce."**

Suggested structure:

```text
Hero
├── Headline
├── Supporting statement
├── Primary CTA
└── Product UI visual

Trust
├── Customer logos
└── Business metrics

Product
├── POS
├── Inventory
├── Analytics
└── Multi-outlet management

Workflow
├── Sell
├── Manage
├── Analyze
└── Grow

Enterprise
├── Role management
├── Multi-outlet
├── Reporting
└── Integrations

CTA
└── Start using Paylo
```

### Hero direction

Use a clean enterprise SaaS composition:

```text
                 PAYLO

      Run your business
      smarter with Paylo.

   Modern POS, inventory, payments,
   and business intelligence in one platform.

        [ Get Started ]  [ Book a Demo ]

              ┌───────────────┐
              │   POS UI      │
              │               │
              │  Rp 128.4M    │
              │  ↑ 12.8%      │
              └───────────────┘
```

---

# 24. Enterprise UI Principles

Paylo should follow these principles across every product surface:

### 01 — Clarity over decoration

Every visual element should help users understand or act.

### 02 — Data first

Business numbers should be easy to scan.

### 03 — Consistency creates trust

Components should behave identically across modules.

### 04 — Reduce operational friction

The most frequent workflows should require the fewest steps.

### 05 — Design for scale

A system that works with 10 products should also work with 100,000 products.

### 06 — Make important states obvious

Payment, stock, transaction, and system states must be unmistakable.

---

# 25. Component Naming

Use a scalable component architecture:

```text
Button
Input
Select
DatePicker
SearchInput
Badge
Tooltip
Dropdown
Modal
Drawer
Tabs
Card
KpiCard
DataTable
Pagination
ChartCard
EmptyState
ErrorState
LoadingSkeleton
ProductCard
TransactionRow
PaymentMethodCard
Sidebar
Topbar
Breadcrumb
```

---

# 26. Design File Structure

Recommended Figma structure:

```text
PAYLO DESIGN SYSTEM
│
├── 00 — Foundations
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   ├── Radius
│   ├── Shadows
│   └── Icons
│
├── 01 — Components
│   ├── Buttons
│   ├── Inputs
│   ├── Tables
│   ├── Cards
│   ├── Navigation
│   ├── Modals
│   └── Feedback
│
├── 02 — Patterns
│   ├── Forms
│   ├── Filters
│   ├── Search
│   ├── CRUD
│   └── Analytics
│
├── 03 — Product
│   ├── Dashboard
│   ├── POS
│   ├── Products
│   ├── Inventory
│   ├── Transactions
│   ├── Customers
│   ├── Reports
│   └── Settings
│
└── 04 — Marketing
    ├── Landing Page
    ├── Pricing
    ├── About
    └── Contact
```

---

# 27. Final Creative Direction

Paylo should visually sit between:

- **Enterprise SaaS**
- **Modern financial technology**
- **Retail operations software**

The interface should feel:

> **Clean. Precise. Confident. Fast. Scalable.**

The product must avoid looking like a basic cashier application. The visual system should communicate that Paylo is a **business platform** capable of handling transactions, inventory, analytics, employees, customers, and multi-outlet operations at scale.

## Core visual formula

```text
Neutral foundation
        +
Strong blue brand accent
        +
Dense but readable information
        +
Clear data hierarchy
        +
Minimal decoration
        +
Consistent enterprise components
        =
PAYLO
```

---

# 28. Implementation Priority

Build the design system in this order:

1. Foundations
2. Typography
3. Color tokens
4. Buttons
5. Inputs
6. Navigation
7. Cards
8. Tables
9. Modals / Drawers
10. Dashboard
11. POS
12. Inventory
13. Transactions
14. Reports
15. Responsive layouts
16. Marketing website

**Design goal:** every new Paylo feature should look like it belongs to the same product without requiring a new visual language.
