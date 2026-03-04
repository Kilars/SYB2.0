# 039-FEATURE-mobile-navbar-redesign

**Status**: Backlog
**Created**: 2026-03-04
**Priority**: High
**Type**: FEATURE
**Estimated Effort**: Simple

---

## Context

The current navbar is too wide on mobile. All three mode links (Casual, Leagues, Tournaments) plus the logo icon plus the hamburger button overflow or feel cramped on small screens (<600px). The mobile layout needs to be more compact:

- **Mobile (xs)**: `[Home icon] [Casual] [Leagues] [Hamburger]` — Tournaments moves into hamburger
- **Desktop (sm+)**: Unchanged — all three mode links in main nav
- **Hamburger additions**: Tournaments link (mobile only), Logout button, plus existing Profile/Create/Theme items

---

## Acceptance Criteria

- [x] Mobile (xs <600px): navbar shows `[Home icon] [Casual] [Leagues] [Hamburger]` — no Tournaments in main nav
- [x] Mobile hamburger menu contains: Tournaments (mobile only), Create Tournament, Profile, Logout, theme switches
- [x] Desktop (sm+ ≥600px): unchanged — all three mode links (Casual, Leagues, Tournaments) in main nav
- [x] Logout button calls `logoutUser.mutate()` and works correctly
- [x] Active state styling (yellow text + left border) still works on all nav items
- [x] `cd client && npm run build` passes

---

## Implementation Steps

### Frontend

**File**: `client/src/app/layout/NavBar.tsx`

#### Step 1: Hide Tournaments link on mobile
- [x] Wrap the Tournaments `MenuItemLink` (line 75) in a `Box` with `sx={{ display: { xs: "none", sm: "flex" } }}`
- [x] This hides it on xs breakpoint while keeping it visible on sm+

#### Step 2: Add Tournaments to hamburger menu (mobile only)
- [x] Add a `MenuItem` linking to `/tournaments` inside the `Menu` dropdown
- [x] Apply `sx={{ display: { xs: "flex", sm: "none" } }}` so it only shows on mobile
- [x] Use `EmojiEvents` icon (already imported) for consistency
- [x] Place it above the Create items logically

#### Step 3: Add Logout to hamburger menu
- [x] Destructure `logoutUser` from `useAccount()` (currently only `currentUser` is destructured, line 23)
- [x] Import `Logout` icon from `@mui/icons-material`
- [x] Add a Logout `MenuItem` visible only when `currentUser` is truthy
- [x] On click: call `logoutUser.mutate()` + `handleClose()`
- [x] Place it after Create Tournament, before the Divider

#### Step 4: Compact mobile logo spacing
- [x] Change the NavLink `marginRight: 24` (line 55) to a responsive value: `marginRight: { xs: 8, sm: 24 }` using sx instead of style
- [x] This gives more room for nav items on mobile

---

## Domain Risk Checklist

- [x] **Composite keys**: No composite key columns are being modified
- [x] **Round-robin**: Match generation logic is not affected
- [x] **Statistics**: Points/flawless computation is not affected
- [x] **Guest identity**: UserId FK references are preserved
- [x] **Authorization**: Route params match handler expectations

**No domain risks** — pure frontend navbar layout change.

---

## Dependencies

- **Blocked by**: None
- **Blocks**: None

---

## Code References

Current NavBar structure:
```tsx
// File: client/src/app/layout/NavBar.tsx

// Line 23 — destructure logoutUser too:
const { currentUser } = useAccount();
// Change to: const { currentUser, logoutUser } = useAccount();

// Lines 73-75 — mode links (hide Tournaments on xs):
<MenuItemLink to="/casual"> Casual </MenuItemLink>
<MenuItemLink to="/leagues"> Leagues </MenuItemLink>
<MenuItemLink to="/tournaments"> Tournaments </MenuItemLink>  // Wrap in display:{xs:"none",sm:"flex"}

// Lines 101-125 — hamburger menu items:
// Add Tournaments (mobile only) + Logout here

// Line 55 — logo marginRight (make responsive):
marginRight: 24  // Change to responsive value
```

MenuItemLink active state pattern:
```tsx
// File: client/src/app/shared/components/MenuItemLink.tsx
"&.active": {
  color: SMASH_COLORS.p3Yellow,
  borderLeft: `4px solid ${SMASH_COLORS.p3Yellow}`,
}
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — single file change in NavBar.tsx
- **Risk**: Low — isolated UI change in one component

---

## Progress Log

[Updated during implementation]

---

## Resolution

[Filled when complete]
