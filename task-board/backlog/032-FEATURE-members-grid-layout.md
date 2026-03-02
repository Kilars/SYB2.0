# 032-FEATURE-members-grid-layout

**Status**: Backlog
**Created**: 2026-03-02
**Priority**: Low
**Type**: FEATURE
**Estimated Effort**: Simple

---

## Context

The members grid in both Leaderboard.tsx and LeagueList.tsx uses too few columns at larger breakpoints, causing unnecessary vertical space. With many league members, the list becomes very tall. Adding more columns at larger breakpoints will make better use of horizontal space.

---

## Acceptance Criteria

- [ ] Leaderboard members grid shows 2 columns on xs, 3 on sm, 4 on md+
- [ ] League list members grid shows 2 columns on xs, 3 on sm+
- [ ] UserChip components don't overflow or get clipped at any breakpoint
- [ ] Layout remains visually balanced and aligned
- [ ] `cd client && npm run build` passes

---

## Implementation Steps

### Frontend
- [ ] **`client/src/features/leagues/Leaderboard.tsx` line 380** — Change grid columns:
  ```tsx
  // Before:
  gridTemplateColumns: { xs: "1fr 1fr", sm: "auto auto auto" }
  // After:
  gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr", md: "1fr 1fr 1fr 1fr" }
  ```
- [ ] **`client/src/features/leagues/LeagueList.tsx` line 142** — Change grid columns:
  ```tsx
  // Before:
  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }
  // After:
  gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr" }
  ```

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

Current Leaderboard members grid (line 380):
```tsx
<Box
  gap={1}
  sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "auto auto auto" } }}
>
```

Current LeagueList members grid (line 142):
```tsx
<Box
  gap={1}
  mt={1}
  sx={{
    display: "grid",
    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
  }}
>
```

---

## Rollback Plan

- **Database**: No migration needed
- **Code**: Git revert — two file changes (Leaderboard.tsx + LeagueList.tsx)
- **Risk**: Low — isolated CSS grid property changes

---

## Progress Log

[Updated during implementation]

---

## Resolution

[Filled when complete]
