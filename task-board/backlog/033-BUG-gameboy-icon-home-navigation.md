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

- [ ] Clicking the SportsEsports icon navigates to `/` on both mobile and desktop
- [ ] Clicking the "SYB" text (visible on sm+) navigates to `/`
- [ ] The link area covers both the icon and text as a single clickable region
- [ ] No visual regression (icon color, spacing, alignment unchanged)
- [ ] `cd client && npm run build` passes

---

## Implementation Steps

### Frontend
- [ ] **`client/src/features/app/layout/NavBar.tsx` lines 48-71** — Investigate and fix the NavLink wrapping. Possible approaches:
  1. **Verify current code works**: The committed code already uses `Box component={NavLink} to="/"` — test if this actually navigates. It might be a caching/build issue.
  2. **If Box component approach fails**: Replace `<Box component={NavLink} to="/">` with a direct `<NavLink to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", marginRight: 24 }}>` wrapping both icon and text.
  3. **Ensure touch target is adequate**: The clickable area should be at least 44x44px on mobile for accessibility.
- [ ] **Test on mobile viewport** — Verify the icon is tappable and navigates to home page

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

[Updated during implementation]

---

## Resolution

[Filled when complete]
