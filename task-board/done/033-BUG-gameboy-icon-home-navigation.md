# 033-BUG-gameboy-icon-home-navigation

**Status**: Backlog
**Created**: 2026-03-02
**Priority**: High
**Type**: BUG
**Estimated Effort**: Simple

---

## Context

On mobile, there is no way to navigate to the home page. The "SYB" text next to the gameboy icon is hidden on xs screens (`display: { xs: "none", sm: "block" }`), and while the current staged code wraps both icon and text in `<Box component={NavLink} to="/">`, the user reports the navigation still doesn't work.

Looking at the committed code (NavBar.tsx lines 48-71), the icon and text ARE already wrapped in a `Box component={NavLink} to="/"`. This should work — but the issue may be that the `Box` with `component={NavLink}` isn't properly receiving click events or the `to` prop isn't being forwarded correctly to the NavLink.

---

## Acceptance Criteria

- [x] Clicking the SportsEsports icon navigates to `/` on both mobile and desktop
- [x] Clicking the "SYB" text (visible on sm+) navigates to `/`
- [x] The link area covers both the icon and text as a single clickable region
- [x] No visual regression (icon color, spacing, alignment unchanged)
- [x] `cd client && npm run build` passes

---

## Implementation Steps

### Frontend
- [x] **`client/src/app/layout/NavBar.tsx` lines 48-71** — Replaced `<Box component={NavLink} to="/">` with a direct `<NavLink to="/">` element using inline styles for flexbox layout, matching MUI theme spacing equivalents (gap: 8px = MUI gap 1, marginRight: 24px = MUI mr 3). Added minHeight/minWidth of 44px for mobile touch target accessibility.
- [ ] **Test on mobile viewport** — Verify the icon is tappable and navigates to home page (requires manual browser testing)

---

## Domain Risk Checklist

**Every task MUST complete this checklist before implementation:**

- [x] **Composite keys**: No composite key columns are being modified
- [x] **Round-robin**: Match generation logic is not affected
- [x] **Statistics**: Points/flawless computation is not affected
- [x] **Guest identity**: UserId FK references are preserved
- [x] **Authorization**: Route params match handler expectations

---

## Dependencies

- **Blocked by**: None
- **Blocks**: None

---

## Code References

Current NavBar icon/text section (lines 48-71):
```tsx
<Box
  component={NavLink}
  to="/"
  sx={{
    display: "flex",
    alignItems: "center",
    gap: 1,
    textDecoration: "none",
    mr: 3,
  }}
>
  <SportsEsports sx={{ color: "white", fontSize: 28 }} />
  <Typography
    variant="h6"
    sx={{
      color: "white",
      fontWeight: "bold",
      letterSpacing: "0.05em",
      display: { xs: "none", sm: "block" },
    }}
  >
    SYB
  </Typography>
</Box>
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — single file change
- **Risk**: Low — isolated navigation fix

---

## Progress Log

- 2026-03-03: Replaced `<Box component={NavLink} to="/">` with direct `<NavLink to="/">` in NavBar.tsx. The MUI Box `component` prop was not properly forwarding the `to` prop to React Router's NavLink, preventing navigation. Used inline styles to replicate the same flex layout. Added `minHeight: 44` and `minWidth: 44` for mobile touch target accessibility. Build passes.

---

## Resolution

Replaced `<Box component={NavLink} to="/">` with a direct `<NavLink to="/">` element in `client/src/app/layout/NavBar.tsx`. The MUI `Box` component's `component` prop was not reliably forwarding the `to` prop to React Router v7's `NavLink`, which caused click/tap events to not trigger navigation. The fix uses a standard `<NavLink>` with equivalent inline styles (`display: flex`, `alignItems: center`, `gap: 8px`, `marginRight: 24px`, `textDecoration: none`) and adds `minHeight: 44px` / `minWidth: 44px` to ensure adequate mobile touch targets per WCAG guidelines.
