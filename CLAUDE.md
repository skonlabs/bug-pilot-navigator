# BugPilot Navigator — Claude Code Context

## Project Overview
A dark-theme SaaS incident management platform ("void UI" — space dark + electric cyan signals).
Built with React + TypeScript + Vite + Tailwind CSS + shadcn/ui + Framer Motion.

**Stack:** React 18, TypeScript, Vite, Tailwind CSS v3, shadcn/ui, Framer Motion, Lucide icons, date-fns, Zustand (app-store), React Router v6.

---

## Architecture

### Layout
- `DashboardLayout.tsx` — root shell: fixed `SideNav` (left) + `TopBar` (sticky top) + `<main>`
  - `<main>` padding: `p-4 md:p-5 xl:p-6` (responsive — this matters for pages that break out)
  - Content margin: `md:ml-52` (matches sidebar `w-52` = 208px)
  - Mobile: sidebar hidden (`hidden md:block`), content `ml-0`

### Key Pages
| Route | File | Notes |
|---|---|---|
| `/` | `Index.tsx` | Dashboard — metric cards, active incidents, quick actions |
| `/incidents` | `IncidentsPage.tsx` | Incident list table |
| `/incidents/:id` | `InvestigationPage.tsx` | 2-panel: left context (240px) + center evidence timeline |
| `/incidents/:id/postmortem` | `PostmortemPage.tsx` | Full-bleed layout |
| `/incidents/:id/resolution` | `ResolutionPacketPage.tsx` | Full-bleed layout |
| `/topology` | `TopologyPage.tsx` | Full-viewport flex canvas |
| `/fixes` | `FixApprovalsPage.tsx` | |
| `/readiness` | `ReadinessPage.tsx` | Table min-w-[700px] |
| `/reports` | `ReportsPage.tsx` | |
| `/integrations` | `IntegrationsPage.tsx` | |
| `/settings` | `SettingsPage.tsx` | |

### Components
- `SideNav.tsx` — fixed sidebar, `w-52` expanded / `w-14` collapsed
- `TopBar.tsx` — sticky h-12 header; shows P0 active badge, notifications popover, user profile popover
- `bugpilot/` — domain components: `SeverityBadge`, `StatusBadge`, `ConfidenceBar`, `EvidenceItemCard`, `HypothesisCard`, `FixProposalCard`

### Data
- All data is mock: `src/data/mock-data.ts`
- Types: `src/types/bugpilot.ts`

---

## Critical Layout Rule — Full-Bleed Pages
Pages that need to escape `<main>`'s responsive padding **must** use responsive negative margins:

```tsx
// CORRECT — matches p-4 md:p-5 xl:p-6
<div className="-m-4 md:-m-5 xl:-m-6 ...">

// WRONG — only works on xl, causes bleed on smaller screens
<div className="-m-6 ...">
```

**Pages using full-bleed escape:**
- `InvestigationPage.tsx:264` — `flex flex-col`
- `PostmortemPage.tsx:314` — `space-y-0`
- `ResolutionPacketPage.tsx:126` — `space-y-0`
- `TopologyPage.tsx:101` — `flex h-[calc(100vh-3rem)]`

**Sticky sub-headers inside full-bleed pages** use `sticky top-14 z-10`
(top-14 = 56px = h-12 topbar 48px + 8px border buffer).

---

## Design Tokens (index.css)
```
--background: 222 47% 3.5%     deep space navy
--primary: 189 80% 52%         electric cyan (#22d3ee)
--severity-p0: 354 100% 60%    bright red
--severity-p1: 33 100% 50%     orange-amber
--severity-p2: 45 91% 53%      gold-yellow
--severity-p3: 210 100% 65%    blue
```
Custom utilities in `index.css`: `gradient-brand`, `scrollbar-thin`, `surface-hover`, `surface-raised`.

---

## Session History

### Session 1 — Layout Bug Fix + Laptop UX (2026-03-05)
**Branch:** `claude/build-platform-from-docs-mJw10`

**Bug fixed — sidebar overlap:**
- Root cause: full-bleed pages used flat `-m-6` but `<main>` padding is responsive
  (`p-4` base, `p-5` md, `p-6` xl). On 1024px laptops content bled past sidebar by 8–16px.
- Fix: changed all 4 full-bleed pages from `-m-6` to `-m-4 md:-m-5 xl:-m-6`
- Also fixed `SideNav` width (`w-56` → `w-52`) to match `DashboardLayout`'s `md:ml-52`

**UX improvements:**
- Investigation left panel: `260px → 240px` + `bg-muted/20` (visual separation)
- Investigation phase stepper: replaced pill style with `border-b-2` underline on active phase
- Incidents table: `min-w-[900px] → min-w-[740px]` (prevents scroll on 1024px laptops)
- Incidents table: Env + IC columns → `hidden xl:table-cell` (reclaims 180px below 1280px)
- Topology height: `calc(100vh-7rem) → calc(100vh-3rem)` (correct now padding is cancelled)
- Dashboard grid: `xl:grid-cols-5 → lg:grid-cols-5` (activates at 1024px not 1280px)
