# 037-FEATURE-homepage-background-scroll-fix

**Status**: Backlog
**Created**: 2026-03-04
**Priority**: Medium
**Type**: FEATURE
**Estimated Effort**: Simple

---

## Context

When logged out (unauthenticated), the homepage shows only the HeroSection but the page is still scrollable — the user can scroll past the hero and see empty space where the background gradient disappears. The page should fill exactly the viewport with no scrolling possible when there's no content below.

The logged-in (authenticated) view keeps its current behavior — gradient on the hero section, `background.default` for content below.

---

## Acceptance Criteria

- [x] Logged out: page fills exactly the viewport, no scrollbar visible, cannot scroll
- [x] Logged in: no change — current behavior preserved
- [x] All 5 themes still look correct
- [x] No regressions on non-homepage routes
- [x] `cd client && npm run build` passes

---

## Implementation Steps

### Frontend

#### Step 1: Prevent scroll on unauthenticated homepage (`client/src/features/home/HomePage.tsx`)
- [x] In the `!currentUser` return path (line 419-421), wrap `<HeroSection />` in a `<Box>` with `height: "100vh"` and `overflow: "hidden"`
- [x] Adjust HeroSection `minHeight` to `100vh` (currently `calc(100vh - 96px)` accounts for a navbar that doesn't exist on homepage)
  - Either pass a prop to HeroSection or conditionally set height
  - Alternative: since homepage has no navbar, the `-96px` offset creates visible empty space — change to `100vh`

---

## Domain Risk Checklist

- [x] **Composite keys**: No composite key columns are being modified
- [x] **Round-robin**: Match generation logic is not affected
- [x] **Statistics**: Points/flawless computation is not affected
- [x] **Guest identity**: UserId FK references are preserved
- [x] **Authorization**: Route params match handler expectations

**No domain risks** — pure frontend styling change.

---

## Dependencies

- **Blocked by**: None
- **Blocks**: None

---

## Code References

```tsx
// File: client/src/features/home/HomePage.tsx (lines 419-421)
if (!currentUser) {
  return <HeroSection />;  // Wrap in overflow-hidden viewport box
}
```

```tsx
// HeroSection Paper (lines 21-35) — minHeight needs adjustment
<Paper sx={{ minHeight: "calc(100vh - 96px)", ... }}>
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — single file change in `HomePage.tsx`
- **Risk**: Low — isolated CSS change

---

## Progress Log

[Updated during implementation]

---

## Resolution

[Filled when complete]
